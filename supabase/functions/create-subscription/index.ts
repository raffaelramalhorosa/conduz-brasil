import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getMpSettings(supabaseAdmin: ReturnType<typeof createClient>) {
  const { data } = await supabaseAdmin.from('mp_settings').select('key, value');
  const map: Record<string, string> = {};
  (data || []).forEach((row: any) => (map[row.key] = row.value));
  const env = map['mp_environment'] || 'sandbox';
  const prefix = env === 'production' ? 'mp_prod' : 'mp_sandbox';
  return {
    environment: env,
    accessToken: map[`${prefix}_access_token`] || null,
  };
}

function mpErrorMessage(mpData: any): string {
  const cause = mpData?.cause?.[0]?.code ?? mpData?.status ?? '';
  const causeStr = String(cause);

  if (causeStr === '2067' || mpData?.message?.toLowerCase().includes('rejected')) {
    return 'Cartão recusado. Tente outro cartão.';
  }
  if (
    causeStr === '2063' ||
    causeStr === '2064' ||
    causeStr === '2065' ||
    mpData?.message?.toLowerCase().includes('invalid')
  ) {
    return 'Dados do cartão inválidos.';
  }
  return 'Erro ao processar assinatura. Tente novamente.';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Método não permitido' }, 405);
    }

    // ── Autenticação ──────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Não autenticado' }, 401);
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return jsonResponse({ error: 'Token inválido' }, 401);
    }
    const userId = user.id;

    // ── Payload ───────────────────────────────────────────────────────────────
    const { owner_type, plan_id, card_token_id, payer_email } = await req.json();

    if (!owner_type || !plan_id || !card_token_id || !payer_email) {
      return jsonResponse({ error: 'owner_type, plan_id, card_token_id e payer_email são obrigatórios' }, 400);
    }
    if (owner_type !== 'instructor' && owner_type !== 'school') {
      return jsonResponse({ error: 'owner_type deve ser "instructor" ou "school"' }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // ── Buscar plano pelo plan_id ──────────────────────────────────────────────
    const { data: plan, error: planErr } = await supabaseAdmin
      .from('subscription_plans')
      .select('id, name, price_cents, billing_interval')
      .eq('id', plan_id)
      .eq('owner_type', owner_type)
      .eq('is_active', true)
      .single();

    if (planErr || !plan) {
      return jsonResponse({ error: 'Plano não encontrado' }, 404);
    }

    // ── Buscar token MP ───────────────────────────────────────────────────────
    const creds = await getMpSettings(supabaseAdmin);
    if (!creds.accessToken) {
      return jsonResponse({ error: 'Token do Mercado Pago não configurado' }, 500);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const transactionAmount = plan.price_cents / 100;
    const notificationUrl = `${supabaseUrl}/functions/v1/subscription-webhook`;
    const isYearly = plan.billing_interval === 'yearly';
    console.log('notification_url enviada ao MP:', notificationUrl);
    console.log('Criando preapproval MP para user:', userId, 'owner_type:', owner_type, 'billing_interval:', plan.billing_interval);

    // ── Chamar MP Preapproval API ─────────────────────────────────────────────
    const preapprovalPayload = {
      reason: `Conduz Brasil — ${plan.name}`,
      payer_email: payer_email,
      card_token_id: card_token_id,
      status: 'authorized',
      start_date: new Date().toISOString(),
      auto_recurring: {
        frequency: isYearly ? 12 : 1,
        frequency_type: 'months',
        transaction_amount: transactionAmount,
        currency_id: 'BRL',
      },
      back_url: 'https://conduzbrasil.com/assinaturas/callback',
      notification_url: notificationUrl,
    };

    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${creds.accessToken}`,
      },
      body: JSON.stringify(preapprovalPayload),
    });

    const mpData = await mpResponse.json();
    console.log('MP preapproval status:', mpResponse.status, 'id:', mpData?.id);

    if (!mpResponse.ok) {
      console.error('Erro MP preapproval:', JSON.stringify(mpData));
      return jsonResponse({ error: mpErrorMessage(mpData) }, 422);
    }

    // ── Calcular fim do período baseado no billing_interval ───────────────────
    const periodEnd = isYearly
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // ── Atualizar assinatura no banco ─────────────────────────────────────────
    const { data: subscription, error: subErr } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        plan_id: plan.id,
        mp_preapproval_id: mpData.id,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq('owner_id', userId)
      .eq('owner_type', owner_type)
      .select('id')
      .single();

    if (subErr || !subscription) {
      console.error('Erro ao atualizar subscription:', subErr);
      return jsonResponse({ error: 'Assinatura criada no MP, mas erro ao atualizar banco. Contate o suporte.' }, 500);
    }

    // ── Registrar pagamento ───────────────────────────────────────────────────
    await supabaseAdmin.from('subscription_payments').insert({
      subscription_id: subscription.id,
      owner_id: userId,
      owner_type: owner_type,
      amount_cents: plan.price_cents,
      status: 'paid',
      mp_payment_id: mpData.id,
      payment_date: new Date().toISOString(),
    });

    // Audit log
    try {
      await supabaseAdmin.rpc('log_audit', {
        p_user_id: userId,
        p_user_type: owner_type,
        p_user_email: payer_email,
        p_action: 'subscription.created',
        p_resource_type: 'subscription',
        p_resource_id: subscription.id,
        p_description: `Assinatura criada: ${plan.name}`,
        p_metadata: { plan_id: plan.id, mp_preapproval_id: mpData.id, amount_cents: plan.price_cents },
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    console.log('Preapproval criado e salvo no banco com sucesso');

    return jsonResponse({
      success: true,
      subscription_id: subscription.id,
      status: 'active',
    });

  } catch (error) {
    console.error('Erro em create-subscription:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      500,
    );
  }
});
