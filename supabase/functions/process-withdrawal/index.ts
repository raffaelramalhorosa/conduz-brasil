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

    // --- MP transfer ---
    if (withdrawal_method === 'mp') {
      const { data: mpAccount } = await supabaseAdmin
        .from('mp_connected_accounts')
        .select('mp_access_token, mp_user_id')
        .eq('instructor_id', ownerId)
        .eq('is_active', true)
        .maybeSingle();

      if (!mpAccount?.mp_access_token || !mpAccount?.mp_user_id) {
        console.error('MP account not connected for:', ownerId);
        return new Response(
          JSON.stringify({ error: 'Conta Mercado Pago não conectada' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Get platform access token from mp_settings
      const { data: envRow } = await supabaseAdmin
        .from('mp_settings')
        .select('value')
        .eq('key', 'mp_environment')
        .single();
      const mpEnv = envRow?.value || 'sandbox';

      const tokenKey = mpEnv === 'production' ? 'mp_prod_access_token' : 'mp_sandbox_access_token';
      const { data: tokenRow } = await supabaseAdmin
        .from('mp_settings')
        .select('value')
        .eq('key', tokenKey)
        .single();
      const platformAccessToken = tokenRow?.value;

      if (!platformAccessToken) {
        console.error('Platform MP access token not configured');
        return new Response(
          JSON.stringify({ error: 'Token da plataforma não configurado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Transfer from platform account to instructor's MP account
      const amountBrlTransfer = amount_cents / 100;
      const transferBody = {
        external_reference: `withdrawal_${withdrawal_id}`,
        point_of_interaction: { type: 'PSP_TRANSFER' },
        seller_configuration: {
          notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
        },
        transaction_amount: amountBrlTransfer,
        description: `Saque - Conduz Brasil`,
        payer: { id: Number(mpAccount.mp_user_id) },
      };

      console.log('Initiating MP transfer:', JSON.stringify(transferBody));

      const mpResponse = await fetch('https://api.mercadopago.com/v1/transaction-intents/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${platformAccessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `withdrawal_${withdrawal_id}`,
        },
        body: JSON.stringify(transferBody),
      });

      const mpResult = await mpResponse.json();
      console.log('MP transfer response:', mpResponse.status, JSON.stringify(mpResult));

      if (!mpResponse.ok) {
        // Rollback: revert the wallet debit since transfer failed
        console.error('MP transfer failed, attempting rollback');
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
            error: 'Falha na transferência via Mercado Pago',
            details: mpResult?.message || `Status: ${mpResponse.status}`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Transfer succeeded — update withdrawal with MP reference
      const now = new Date().toISOString();
      await supabaseAdmin
        .from('withdrawals')
        .update({
          status: 'completed',
          processed_at: now,
          completed_at: now,
          mp_payment_id: String(mpResult.id || ''),
          mp_correlation_id: mpResult.external_reference || '',
        })
        .eq('id', withdrawal_id);
    } else {
      // Non-MP method (pix manual, etc.) — mark as processing for manual handling
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
