import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ok = () =>
  new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const xSignature = req.headers.get('x-signature') || '';
    const xRequestId = req.headers.get('x-request-id') || '';

    const body = await req.json();
    console.log('subscription-webhook received:', JSON.stringify(body));

    const { type, data } = body;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // ── Validação de assinatura (produção apenas, mesmo padrão do mp-webhook) ──
    const { data: envRow } = await supabaseAdmin
      .from('mp_settings')
      .select('value')
      .eq('key', 'mp_environment')
      .single();
    const mpEnvironment = envRow?.value || 'sandbox';

    if (mpEnvironment === 'production') {
      const sigParts: Record<string, string> = {};
      for (const part of xSignature.split(',')) {
        const [key, ...rest] = part.split('=');
        if (key && rest.length) sigParts[key.trim()] = rest.join('=').trim();
      }
      const ts = sigParts['ts'] || '';
      const v1 = sigParts['v1'] || '';

      const webhookSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');
      if (!webhookSecret) {
        console.error('MERCADOPAGO_WEBHOOK_SECRET não configurado');
        return ok();
      }

      const manifest = `id:${data?.id ?? ''};request-id:${xRequestId};ts:${ts};`;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(manifest));
      const computedHash = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      if (computedHash !== v1) {
        console.error('Assinatura inválida', { computedHash, v1, manifest });
        return ok(); // retornar 200 para MP não retentar
      }
      console.log('Assinatura do webhook validada');
    } else {
      console.log('Sandbox: validação de assinatura ignorada');
    }

    const preapprovalId = String(data?.id ?? '');
    if (!preapprovalId) {
      console.log('Nenhum data.id no payload, ignorando');
      return ok();
    }

    const SUBSCRIPTION_EVENTS = [
      'subscription_authorized_payment',
      'subscription_payment_failed',
      'subscription_cancelled',
    ];

    if (!SUBSCRIPTION_EVENTS.includes(type)) {
      console.log('Evento não relacionado a assinaturas, ignorando:', type);
      return ok();
    }

    // ── Buscar assinatura pelo preapproval_id ─────────────────────────────────
    const { data: subscription, error: subErr } = await supabaseAdmin
      .from('subscriptions')
      .select('id, owner_id, owner_type, plan_id, current_period_end, status')
      .eq('mp_preapproval_id', preapprovalId)
      .single();

    if (subErr || !subscription) {
      console.error('Assinatura não encontrada para preapproval_id:', preapprovalId, subErr);
      return ok();
    }

    // ── Buscar plano (price_cents + billing_interval) ─────────────────────────
    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('price_cents, billing_interval')
      .eq('id', subscription.plan_id)
      .single();

    const now = new Date();

    // ── subscription_authorized_payment ───────────────────────────────────────
    if (type === 'subscription_authorized_payment') {
      const isYearly = plan?.billing_interval === 'yearly';
      const periodEnd = isYearly
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', subscription.id);

      await supabaseAdmin.from('subscription_payments').insert({
        subscription_id: subscription.id,
        owner_id: subscription.owner_id,
        owner_type: subscription.owner_type,
        amount_cents: plan?.price_cents ?? 0,
        status: 'paid',
        mp_payment_id: preapprovalId,
        payment_date: now.toISOString(),
      });

      await supabaseAdmin.from('notifications').insert({
        user_id: subscription.owner_id,
        type: 'subscription_renewed',
        title: 'Assinatura renovada',
        message: 'Assinatura renovada com sucesso. Acesso garantido por mais 30 dias.',
        action_url: '/assinaturas',
      });

      console.log('Assinatura renovada:', subscription.id);
    }

    // ── subscription_payment_failed ───────────────────────────────────────────
    if (type === 'subscription_payment_failed') {
      await supabaseAdmin.from('subscription_payments').insert({
        subscription_id: subscription.id,
        owner_id: subscription.owner_id,
        owner_type: subscription.owner_type,
        amount_cents: plan?.price_cents ?? 0,
        status: 'failed',
        mp_payment_id: preapprovalId,
        payment_date: now.toISOString(),
      });

      // Contar falhas consecutivas (da mais recente para trás)
      const { data: recentPayments } = await supabaseAdmin
        .from('subscription_payments')
        .select('status')
        .eq('subscription_id', subscription.id)
        .order('created_at', { ascending: false })
        .limit(10);

      let consecutiveFails = 0;
      for (const p of recentPayments ?? []) {
        if (p.status === 'failed') consecutiveFails++;
        else break;
      }

      console.log('Falhas consecutivas:', consecutiveFails, 'para subscription:', subscription.id);

      if (consecutiveFails >= 3) {
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'suspended', updated_at: now.toISOString() })
          .eq('id', subscription.id);

        await supabaseAdmin.from('notifications').insert({
          user_id: subscription.owner_id,
          type: 'subscription_suspended',
          title: 'Assinatura suspensa',
          message: 'Sua assinatura foi suspensa após 3 tentativas de cobrança sem sucesso. Atualize seu cartão para reativar.',
          action_url: '/assinaturas',
        });
      } else {
        await supabaseAdmin.from('notifications').insert({
          user_id: subscription.owner_id,
          type: 'subscription_payment_failed',
          title: 'Falha no pagamento',
          message: 'Falha no pagamento da assinatura. O Mercado Pago tentará novamente em breve.',
          action_url: '/assinaturas',
        });
      }
    }

    // ── subscription_cancelled ────────────────────────────────────────────────
    if (type === 'subscription_cancelled') {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', subscription.id);

      await supabaseAdmin.from('notifications').insert({
        user_id: subscription.owner_id,
        type: 'subscription_cancelled',
        title: 'Assinatura cancelada',
        message: 'Sua assinatura foi cancelada. O acesso será mantido até o fim do período pago.',
        action_url: '/assinaturas',
      });

      console.log('Assinatura cancelada:', subscription.id);
    }

    return ok();
  } catch (error) {
    console.error('Erro em subscription-webhook:', error);
    return ok(); // sempre 200 para o MP não retentar
  }
});
