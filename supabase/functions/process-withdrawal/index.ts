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

    // --- Auth / user-scoped client ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );

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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

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

    // Check user owns this withdrawal via instructor_profiles
    const { data: profile } = await supabaseAdmin
      .from('instructor_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

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

    // --- MP transfer (placeholder) ---
    if (withdrawal_method === 'mp') {
      const { data: mpAccount } = await supabaseAdmin
        .from('mp_connected_accounts')
        .select('mp_access_token, mp_user_id')
        .eq('instructor_id', ownerId)
        .eq('is_active', true)
        .maybeSingle();

      if (!mpAccount?.mp_access_token) {
        console.error('MP account not connected for:', ownerId);
        return new Response(
          JSON.stringify({ error: 'Conta Mercado Pago não conectada' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      console.log('MP transfer placeholder — mp_user_id:', mpAccount.mp_user_id, 'amount_cents:', amount_cents);
    }

    // --- Update withdrawal status ---
    await supabaseAdmin
      .from('withdrawals')
      .update({ status: 'processing', processed_at: new Date().toISOString() })
      .eq('id', withdrawal_id);

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
