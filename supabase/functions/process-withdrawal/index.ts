import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Auth ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    let userId: string | null = null;

    const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authData?.user?.id) {
      userId = authData.user.id;
    } else {
      try {
        const [, payload] = token.split('.');
        const decoded = JSON.parse(atob(payload));
        userId = typeof decoded?.sub === 'string' ? decoded.sub : null;
      } catch (decodeErr) {
        console.error('JWT decode error:', decodeErr);
      }
    }

    if (!userId) {
      console.error('Auth validation error:', authErr);
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { withdrawal_id, amount_cents, withdrawal_method, pix_key, pix_key_type } = await req.json();

    if (!withdrawal_id || !amount_cents || !withdrawal_method) {
      return new Response(
        JSON.stringify({ error: 'withdrawal_id, amount_cents e withdrawal_method são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // TODO: restaurar validação de mínimo R$100 após testes
    if (amount_cents < 1) {
      return new Response(
        JSON.stringify({ error: 'Valor inválido para saque' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // --- Verify ownership ---
    const { data: withdrawal, error: wErr } = await supabaseAdmin
      .from('withdrawals')
      .select('id, instructor_id, driving_school_id, status')
      .eq('id', withdrawal_id)
      .single();

    if (wErr || !withdrawal) {
      return new Response(JSON.stringify({ error: 'Saque não encontrado' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('instructor_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileErr) {
      console.error('Profile lookup error:', profileErr);
    }

    const ownerId = profile?.id;
    if (!ownerId || (withdrawal.instructor_id !== ownerId && withdrawal.driving_school_id !== ownerId)) {
      return new Response(JSON.stringify({ error: 'Este saque não pertence ao usuário' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (withdrawal.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Saque já está sendo processado' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Process withdrawal atomically ---
    const idempotencyKey = `withdrawal_${withdrawal_id}`;

    const { error: rpcErr } = await supabaseAdmin.rpc('process_withdrawal', {
      p_owner_id: ownerId,
      p_amount_cents: amount_cents,
      p_withdrawal_id: withdrawal_id,
      p_idempotency_key: idempotencyKey,
    });

    if (rpcErr) {
      console.error('process_withdrawal RPC error:', rpcErr);
      const msg = rpcErr.message?.toLowerCase() || '';
      if (msg.includes('insufficient') || msg.includes('insuficiente') || msg.includes('saldo')) {
        return new Response(
          JSON.stringify({ error: 'Saldo disponível insuficiente para este saque' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({ error: 'Erro ao processar saque', details: rpcErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // --- Transfer via Pix using MP's transaction-intents API ---
    if (withdrawal_method === 'mp' || withdrawal_method === 'pix') {
      // Require a Pix key for the transfer
      const { data: pixKeyRow } = await supabaseAdmin
        .from('pix_keys')
        .select('pix_key, pix_key_type')
        .or(`instructor_id.eq.${ownerId},driving_school_id.eq.${ownerId}`)
        .eq('is_default', true)
        .maybeSingle();

      // Allow pix_key from request body as fallback
      const finalPixKey = pixKeyRow?.pix_key || pix_key;
      const finalPixKeyType = pixKeyRow?.pix_key_type || pix_key_type;

      if (!finalPixKey) {
        // Rollback the wallet debit
        try {
          await supabaseAdmin.rpc('rollback_withdrawal', {
            p_owner_id: ownerId,
            p_amount_cents: amount_cents,
            p_withdrawal_id: withdrawal_id,
          });
        } catch (e) { console.error('Rollback error:', e); }

        await supabaseAdmin
          .from('withdrawals')
          .update({ status: 'failed', failure_reason: 'Chave Pix não cadastrada', processed_at: new Date().toISOString() })
          .eq('id', withdrawal_id);

        return new Response(
          JSON.stringify({ error: 'Cadastre uma chave Pix antes de solicitar saque' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Get platform access token and user ID from mp_settings
      const { data: settingsRows } = await supabaseAdmin
        .from('mp_settings')
        .select('key, value')
        .in('key', ['mp_environment', 'mp_prod_access_token', 'mp_sandbox_access_token', 'mp_platform_user_id_prod', 'mp_platform_user_id_sandbox']);

      const settings: Record<string, string> = {};
      (settingsRows || []).forEach((r: { key: string; value: string | null }) => { if (r.value) settings[r.key] = r.value; });

      const mpEnv = settings['mp_environment'] || 'sandbox';
      const platformAccessToken = mpEnv === 'production' ? settings['mp_prod_access_token'] : settings['mp_sandbox_access_token'];
      const platformUserId = mpEnv === 'production' ? settings['mp_platform_user_id_prod'] : settings['mp_platform_user_id_sandbox'];

      if (!platformAccessToken || !platformUserId) {
        console.error('Platform MP credentials not configured');
        return new Response(
          JSON.stringify({ error: 'Credenciais da plataforma não configuradas' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Map pix_key_type to MP bank_id format
      // Pix keys in Brazil use bank_id based on key type
      const pixTypeToBankId: Record<string, string> = {
        cpf: '0',
        cnpj: '0',
        email: '0',
        phone: '0',
        random: '0',
      };

      const amountBrl = amount_cents / 100;
      const transferBody = {
        external_reference: `withdrawal_${withdrawal_id}`,
        point_of_interaction: { type: 'PSP_TRANSFER' },
        seller_configuration: {
          notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
        },
        amount: amountBrl,
        description: `Saque Conduz Brasil - ${withdrawal_id.slice(0, 8)}`,
        payer: { id: Number(platformUserId) },
        to: {
          accounts: [
            {
              amount: amountBrl,
              origin: 'pix',
              pix: {
                type: finalPixKeyType?.toUpperCase() || 'CPF',
                id: finalPixKey,
              },
            },
          ],
        },
      };

      console.log('Initiating Pix transfer via MP:', JSON.stringify({ ...transferBody, payer: { id: '***' } }));

      const mpResponse = await fetch('https://api.mercadopago.com/v1/transaction-intents/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${platformAccessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `withdrawal_${withdrawal_id}`,
          'x-enforce-signature': 'false',
        },
        body: JSON.stringify(transferBody),
      });

      const mpResult = await mpResponse.json();
      console.log('MP Pix transfer response:', mpResponse.status, JSON.stringify(mpResult));

      if (!mpResponse.ok) {
        console.error('MP Pix transfer failed, attempting rollback');
        try {
          await supabaseAdmin.rpc('rollback_withdrawal', {
            p_owner_id: ownerId,
            p_amount_cents: amount_cents,
            p_withdrawal_id: withdrawal_id,
          });
        } catch (rollbackErr) {
          console.error('Rollback failed:', rollbackErr);
        }

        await supabaseAdmin
          .from('withdrawals')
          .update({
            status: 'failed',
            failure_reason: mpResult?.message || `MP API error: ${mpResponse.status}`,
            processed_at: new Date().toISOString(),
          })
          .eq('id', withdrawal_id);

        return new Response(
          JSON.stringify({
            error: 'Falha na transferência Pix via Mercado Pago',
            details: mpResult?.message || `Status: ${mpResponse.status}`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Transfer succeeded
      const now = new Date().toISOString();
      await supabaseAdmin
        .from('withdrawals')
        .update({
          status: 'completed',
          processed_at: now,
          completed_at: now,
          mp_payment_id: String(mpResult.id || ''),
          mp_correlation_id: mpResult.external_reference || '',
          pix_key: finalPixKey,
          pix_key_type: finalPixKeyType,
        })
        .eq('id', withdrawal_id);
    } else {
      // Unknown method — mark as processing for manual handling
      const now = new Date().toISOString();
      await supabaseAdmin
        .from('withdrawals')
        .update({ status: 'processing', processed_at: now })
        .eq('id', withdrawal_id);
    }

    const amountBrl = amount_cents / 100;
    console.log(`Withdrawal ${withdrawal_id} processing: R$ ${amountBrl.toFixed(2)} via ${withdrawal_method}`);

    // Audit log
    try {
      await supabaseAdmin.rpc('log_audit', {
        p_user_id: userId,
        p_user_type: 'instructor',
        p_user_email: null,
        p_action: 'withdrawal.processed',
        p_resource_type: 'withdrawal',
        p_resource_id: withdrawal_id,
        p_description: `Saque de R$ ${amountBrl.toFixed(2)} via ${withdrawal_method}`,
        p_metadata: { amount_cents, withdrawal_method, pix_key, pix_key_type },
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    return new Response(
      JSON.stringify({ success: true, withdrawal_id, amount_brl: amountBrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in process-withdrawal:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
