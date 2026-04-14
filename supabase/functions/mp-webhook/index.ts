import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function getMpCredentials(supabaseAdmin: ReturnType<typeof createClient>) {
  const { data } = await supabaseAdmin
    .from('mp_settings')
    .select('key, value');
  const map: Record<string, string> = {};
  (data || []).forEach((row: any) => (map[row.key] = row.value));
  const env = map['mp_environment'] || 'sandbox';
  const prefix = env === 'production' ? 'mp_prod' : 'mp_sandbox';
  return {
    environment: env,
    accessToken: map[`${prefix}_access_token`] || null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ok = () =>
    new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const xSignature = req.headers.get('x-signature') || '';
    const xRequestId = req.headers.get('x-request-id') || '';

    const body = await req.json();
    console.log('mp-webhook received:', JSON.stringify(body));

    // --- Suporte aos dois formatos de notificação do MP ---
    // Novo formato: { type: "payment", data: { id: "123" } }
    // Antigo formato: { topic: "payment", resource: "123" }
    const eventType: string = body.type || body.topic || '';
    const newFormatId: string | null = body.data?.id ? String(body.data.id) : null;
    const oldFormatResource: string = body.resource || '';
    // Para topic=payment o resource é o ID direto; para merchant_order é uma URL
    const oldFormatPaymentId: string | null =
      body.topic === 'payment' ? oldFormatResource : null;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // --- Check environment to decide signature validation ---
    const { data: envRow } = await supabaseAdmin
      .from('mp_settings')
      .select('value')
      .eq('key', 'mp_environment')
      .single();
    const mpEnvironment = envRow?.value || 'sandbox';
    console.log('MP environment:', mpEnvironment);

    // Validação de assinatura: apenas no formato novo (data.id presente) em produção.
    // O formato antigo (topic/resource) não carrega o id no manifest — validação
    // de assinatura sempre falharia com id vazio. Confiamos no IP do MP para esse caso.
    if (mpEnvironment === 'production' && newFormatId) {
      const sigParts: Record<string, string> = {};
      for (const part of xSignature.split(',')) {
        const [key, ...rest] = part.split('=');
        if (key && rest.length) sigParts[key.trim()] = rest.join('=').trim();
      }
      const ts = sigParts['ts'] || '';
      const v1 = sigParts['v1'] || '';

      const webhookSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');
      if (!webhookSecret) {
        console.warn('MERCADOPAGO_WEBHOOK_SECRET não configurado — pulando validação');
      } else {
        const manifest = `id:${newFormatId};request-id:${xRequestId};ts:${ts};`;
        const encoder = new TextEncoder();
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          encoder.encode(webhookSecret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign'],
        );
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(manifest));
        const computedHash = Array.from(new Uint8Array(signature))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        if (computedHash !== v1) {
          console.error('Invalid webhook signature', { computedHash, v1, manifest });
          return new Response(JSON.stringify({ error: 'Invalid signature' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.log('Webhook signature validated successfully');
      }
    } else if (mpEnvironment !== 'production') {
      console.log('Sandbox: validação de assinatura ignorada');
    } else {
      console.log('Formato antigo (topic/resource): validação de assinatura ignorada');
    }

    // Reencaminhar eventos de assinatura para subscription-webhook
    if (eventType === 'subscription_authorized_payment' || eventType === 'subscription_preapproval') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      fetch(`${supabaseUrl}/functions/v1/subscription-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'x-signature': xSignature,
          'x-request-id': xRequestId,
        },
        body: JSON.stringify(body),
      }).catch((err) => console.error('subscription-webhook forward failed:', err));
      console.log('Forwarded subscription event to subscription-webhook:', eventType);
      return ok();
    }

    // Resolver o payment ID independente do formato
    const mpPaymentId = newFormatId || oldFormatPaymentId;

    if (eventType !== 'payment' || !mpPaymentId) {
      console.log('Ignorando notificação não-pagamento:', eventType, '| resource:', oldFormatResource);
      return ok();
    }

    console.log('Processando pagamento ID:', mpPaymentId, '| formato:', newFormatId ? 'novo' : 'antigo');

    // Get MP credentials from DB
    const creds = await getMpCredentials(supabaseAdmin);
    if (!creds.accessToken) {
      console.error('MP access token not configured in mp_credentials');
      return ok();
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
      headers: { Authorization: `Bearer ${creds.accessToken}` },
    });

    const mpPayment = await mpRes.json();

    if (!mpRes.ok) {
      console.error('Error fetching payment from MP:', JSON.stringify(mpPayment));
      return ok();
    }

    const bookingId = mpPayment.external_reference;
    const mpStatus = mpPayment.status;
    const transactionAmount = mpPayment.transaction_amount;
    const paymentMethod = mpPayment.payment_method_id;
    const paymentMethodDetail = mpPayment.payment_type_id;
    const installments = mpPayment.installments;
    const payerEmail = mpPayment.payer?.email;
    const payerName = [mpPayment.payer?.first_name, mpPayment.payer?.last_name].filter(Boolean).join(' ') || null;
    const payerTaxId = mpPayment.payer?.identification?.number || null;
    const merchantOrderId = mpPayment.order?.id ? String(mpPayment.order.id) : null;

    console.log(`Payment ${mpPaymentId}: status=${mpStatus}, booking=${bookingId}, amount=${transactionAmount}`);

    // Ignorar pagamentos de assinatura (sem external_reference são cobranças recorrentes)
    // O mp-webhook só processa pagamentos de aulas (bookings)
    if (!bookingId) {
      console.log('Pagamento sem external_reference — possivelmente assinatura, ignorando:', mpPaymentId);
      return ok();
    }

    const chargeStatusMap: Record<string, string> = {
      approved: 'approved',
      authorized: 'approved',
      rejected: 'rejected',
      cancelled: 'cancelled',
      refunded: 'refunded',
      charged_back: 'refunded',
      in_process: 'in_process',
      in_mediation: 'in_process',
      pending: 'awaiting_payment',
    };

    const chargeStatus = chargeStatusMap[mpStatus] || 'pending';

    const { data: existingCharge, error: findError } = await supabaseAdmin
      .from('payment_charges')
      .select('id, booking_id, student_id, collector_id')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !existingCharge) {
      console.error('Could not find payment_charge for booking:', bookingId, findError);
      return ok();
    }

    const updateData: Record<string, unknown> = {
      status: chargeStatus,
      mp_payment_id: mpPaymentId,
      mp_merchant_order_id: merchantOrderId,
      payment_method: paymentMethod,
      payment_method_detail: paymentMethodDetail,
      installments: installments || 1,
      payer_email: payerEmail,
      payer_name: payerName,
      payer_tax_id: payerTaxId,
    };

    if (mpStatus === 'approved') {
      updateData.paid_at = new Date().toISOString();
    }
    if (mpStatus === 'refunded' || mpStatus === 'charged_back') {
      updateData.refunded_at = new Date().toISOString();
    }

    const { error: updateChargeError } = await supabaseAdmin
      .from('payment_charges')
      .update(updateData)
      .eq('id', existingCharge.id);

    if (updateChargeError) {
      console.error('Error updating payment_charge:', updateChargeError);
    }

    // Handle approved payments
    if (mpStatus === 'approved') {
      console.log('Payment approved – updating booking, notifying student and instructor');

      await supabaseAdmin.from('bookings').update({ payment_status: 'paid' }).eq('id', bookingId);

      // Fetch booking to get instructor/school info and amounts
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('instructor_id, driving_school_id, is_affiliated_booking, instructor_amount, platform_fee')
        .eq('id', bookingId)
        .single();

      // Resolve recipient user_id (instructor or school owner)
      let recipientUserId: string | null = null;
      if (booking?.is_affiliated_booking && booking?.driving_school_id) {
        const { data: school } = await supabaseAdmin
          .from('school_profiles')
          .select('user_id')
          .eq('id', booking.driving_school_id)
          .single();
        recipientUserId = school?.user_id ?? null;
      } else if (booking?.instructor_id) {
        const { data: instructor } = await supabaseAdmin
          .from('instructor_profiles')
          .select('user_id')
          .eq('id', booking.instructor_id)
          .single();
        recipientUserId = instructor?.user_id ?? null;
      }

      const instructorAmount = booking?.instructor_amount ?? (transactionAmount - (booking?.platform_fee ?? 0));

      // Audit log
      try {
        await supabaseAdmin.rpc('log_audit', {
          p_user_id: existingCharge.student_id,
          p_user_type: 'student',
          p_user_email: payerEmail,
          p_action: 'payment.approved',
          p_resource_type: 'payment',
          p_resource_id: existingCharge.id,
          p_description: `Pagamento de R$ ${transactionAmount} aprovado via ${paymentMethod}`,
          p_metadata: {
            mp_payment_id: mpPaymentId,
            booking_id: bookingId,
            amount: transactionAmount,
            payment_method: paymentMethod,
          },
        });
      } catch (auditErr) {
        console.error('Audit log error:', auditErr);
      }

      // Notify student
      await supabaseAdmin.from('notifications').insert({
        user_id: existingCharge.student_id,
        type: 'payment_confirmed',
        title: 'Pagamento Confirmado',
        message: `Seu pagamento de R$ ${transactionAmount?.toFixed(2)} foi confirmado!`,
        action_url: `/aluno/aulas`,
        booking_id: bookingId,
      });

      // Notify instructor/school
      if (recipientUserId) {
        await supabaseAdmin.from('notifications').insert({
          user_id: recipientUserId,
          type: 'payment_received',
          title: 'Pagamento recebido',
          message: `Você receberá R$ ${Number(instructorAmount).toFixed(2)} em sua conta Mercado Pago. O aluno pode solicitar reembolso em até 24h.`,
          action_url: '/admin/financeiro',
          booking_id: bookingId,
        });
      }
    }

    // Handle refunded payments
    if (mpStatus === 'refunded' || mpStatus === 'charged_back') {
      console.log('Payment refunded – updating booking and reversing transactions');

      await supabaseAdmin.from('bookings').update({ payment_status: 'refunded' }).eq('id', bookingId);
      await supabaseAdmin.from('transactions').update({ status: 'reversed' }).eq('booking_id', bookingId).in('status', ['pending', 'available']);

      await supabaseAdmin.from('notifications').insert({
        user_id: existingCharge.student_id,
        type: 'payment_refunded',
        title: 'Reembolso Processado',
        message: `Seu reembolso de R$ ${transactionAmount?.toFixed(2)} foi processado.`,
        action_url: `/aluno/aulas`,
        booking_id: bookingId,
      });
    }

    // Handle rejected payments
    if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
      console.log('Payment rejected/cancelled – notifying student');

      await supabaseAdmin.from('notifications').insert({
        user_id: existingCharge.student_id,
        type: 'payment_rejected',
        title: mpStatus === 'rejected' ? 'Pagamento Recusado' : 'Pagamento Cancelado',
        message: mpStatus === 'rejected'
          ? 'Seu pagamento foi recusado. Tente novamente com outro método de pagamento.'
          : 'O pagamento foi cancelado.',
        action_url: `/aluno/aulas`,
        booking_id: bookingId,
      });
    }

    return ok();
  } catch (error) {
    console.error('Error in mp-webhook:', error);
    return ok();
  }
});
