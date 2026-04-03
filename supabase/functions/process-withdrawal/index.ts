import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PIX_TYPE_TO_ASAAS: Record<string, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'EMAIL',
  phone: 'PHONE',
  random: 'EVP',
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

    // --- Debit wallet atomically ---
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

    // --- Send Pix via Asaas ---
    if (withdrawal_method === 'pix' || withdrawal_method === 'mp') {
      // Resolve pix key: prefer saved default, fallback to request body
      const { data: pixKeyRow } = await supabaseAdmin
        .from('pix_keys')
        .select('pix_key, pix_key_type')
        .or(`instructor_id.eq.${ownerId},driving_school_id.eq.${ownerId}`)
        .eq('is_default', true)
        .maybeSingle();

      const finalPixKey = pixKeyRow?.pix_key || pix_key;
      const finalPixKeyType = pixKeyRow?.pix_key_type || pix_key_type;

      if (!finalPixKey) {
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

      const asaasKey = Deno.env.get('ASAAS_API_KEY');
      if (!asaasKey) {
        console.error('ASAAS_API_KEY not configured');
        return new Response(
          JSON.stringify({ error: 'Gateway de pagamento não configurado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const asaasEnv = Deno.env.get('ASAAS_ENV') || 'sandbox';
      const asaasBase = asaasEnv === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://sandbox.asaas.com/api/v3';

      const asaasPixType = PIX_TYPE_TO_ASAAS[finalPixKeyType?.toLowerCase()] || 'EVP';
      const amountBrl = amount_cents / 100;

      console.log('Initiating Pix transfer via Asaas:', {
        value: amountBrl,
        pixAddressKeyType: asaasPixType,
        env: asaasEnv,
      });

      const asaasRes = await fetch(`${asaasBase}/transfers`, {
        method: 'POST',
        headers: {
          'access_token': asaasKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: amountBrl,
          operationType: 'PIX',
          pixAddressKey: finalPixKey,
          pixAddressKeyType: asaasPixType,
          description: `Saque Conduz Brasil - ${withdrawal_id.slice(0, 8)}`,
        }),
      });

      const asaasResult = await asaasRes.json();
      console.log('Asaas transfer response:', asaasRes.status, JSON.stringify(asaasResult));

      if (!asaasRes.ok || asaasResult.errors?.length) {
        const reason = asaasResult.errors?.[0]?.description || asaasResult.message || `Asaas error: ${asaasRes.status}`;
        console.error('Asaas transfer failed:', reason);

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
            failure_reason: reason,
            processed_at: new Date().toISOString(),
          })
          .eq('id', withdrawal_id);

        return new Response(
          JSON.stringify({ error: 'Falha na transferência Pix', details: reason }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Asaas transfer initiated successfully
      const now = new Date().toISOString();
      // Status PENDING means Asaas accepted and is processing — treat as completed from our side
      await supabaseAdmin
        .from('withdrawals')
        .update({
          status: 'completed',
          processed_at: now,
          completed_at: now,
          mp_payment_id: String(asaasResult.id || ''),
          pix_key: finalPixKey,
          pix_key_type: finalPixKeyType,
        })
        .eq('id', withdrawal_id);

    } else {
      // Unknown method — mark as processing for manual handling
      await supabaseAdmin
        .from('withdrawals')
        .update({ status: 'processing', processed_at: new Date().toISOString() })
        .eq('id', withdrawal_id);
    }

    const amountBrl = amount_cents / 100;
    console.log(`Withdrawal ${withdrawal_id} completed: R$ ${amountBrl.toFixed(2)} via ${withdrawal_method}`);

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
