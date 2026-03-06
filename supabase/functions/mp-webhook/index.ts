import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Always return 200 to MP
  const ok = () =>
    new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    // --- Signature validation ---
    const xSignature = req.headers.get('x-signature') || '';
    const xRequestId = req.headers.get('x-request-id') || '';

    const body = await req.json();
    console.log('mp-webhook received:', JSON.stringify(body));

    const { type, data } = body;

    // Extract ts and v1 from x-signature (format: ts=123456,v1=abcdef...)
    const sigParts: Record<string, string> = {};
    for (const part of xSignature.split(',')) {
      const [key, ...rest] = part.split('=');
      if (key && rest.length) sigParts[key.trim()] = rest.join('=').trim();
    }
    const ts = sigParts['ts'] || '';
    const v1 = sigParts['v1'] || '';

    const webhookSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('MERCADOPAGO_WEBHOOK_SECRET not configured');
      return ok();
    }

    // Build manifest: id:{data.id};request-id:{x-request-id};ts:{ts};
    const manifest = `id:${data?.id ?? ''};request-id:${xRequestId};ts:${ts};`;

    // HMAC-SHA256 using Web Crypto API
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
      console.error('Invalid webhook signature', { computedHash, v1, manifest });
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Webhook signature validated successfully');

    // MP also sends "test" notifications and other types – ignore them
    if (type !== 'payment' || !data?.id) {
      console.log('Ignoring non-payment notification:', type);
      return ok();
    }

    const mpPaymentId = String(data.id);

    // 1) Fetch payment details from MP
    const mpAccessToken = Deno.env.get('MERCADOPAGO_PUBLIC_ACESSTOKEN');
    if (!mpAccessToken) {
      console.error('MERCADOPAGO_PUBLIC_ACESSTOKEN not configured');
      return ok();
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    });

    const mpPayment = await mpRes.json();

    if (!mpRes.ok) {
      console.error('Error fetching payment from MP:', JSON.stringify(mpPayment));
      return ok();
    }

    const bookingId = mpPayment.external_reference;
    const mpStatus = mpPayment.status; // approved, rejected, pending, refunded, in_process, cancelled
    const transactionAmount = mpPayment.transaction_amount;
    const paymentMethod = mpPayment.payment_method_id;
    const paymentMethodDetail = mpPayment.payment_type_id;
    const installments = mpPayment.installments;
    const payerEmail = mpPayment.payer?.email;
    const payerName = [mpPayment.payer?.first_name, mpPayment.payer?.last_name].filter(Boolean).join(' ') || null;
    const payerTaxId = mpPayment.payer?.identification?.number || null;
    const merchantOrderId = mpPayment.order?.id ? String(mpPayment.order.id) : null;

    console.log(`Payment ${mpPaymentId}: status=${mpStatus}, booking=${bookingId}, amount=${transactionAmount}`);

    if (!bookingId) {
      console.error('No external_reference (booking_id) in MP payment');
      return ok();
    }

    // 2) Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Map MP status to our charge status
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

    // 3) Update payment_charges by booking_id + mp_preference match
    // Find the charge for this booking
    const { data: existingCharge, error: findError } = await supabaseAdmin
      .from('payment_charges')
      .select('id, booking_id, student_id')
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

    // 4) Handle approved payments
    if (mpStatus === 'approved') {
      console.log('Payment approved – updating booking and creating transactions');

      // Update booking payment_status
      const { error: bookingError } = await supabaseAdmin
        .from('bookings')
        .update({ payment_status: 'paid' })
        .eq('id', bookingId);

      if (bookingError) {
        console.error('Error updating booking payment_status:', bookingError);
      }

      // Note: Transactions are created by the trigger `create_transaction_after_class`
      // when the booking status changes to 'completed'. Payment approval doesn't
      // create transactions directly – the instructor still needs to deliver the class.
      // We just mark it as paid so the flow can continue.

      // Notify student
      const { error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: existingCharge.student_id,
          type: 'payment_confirmed',
          title: 'Pagamento Confirmado',
          message: `Seu pagamento de R$ ${transactionAmount?.toFixed(2)} foi confirmado!`,
          action_url: `/aluno/aulas`,
          booking_id: bookingId,
        });

      if (notifError) {
        console.error('Error creating student notification:', notifError);
      }
    }

    // 5) Handle refunded payments
    if (mpStatus === 'refunded' || mpStatus === 'charged_back') {
      console.log('Payment refunded – updating booking and reversing transactions');

      // Update booking payment_status
      const { error: bookingError } = await supabaseAdmin
        .from('bookings')
        .update({ payment_status: 'refunded' })
        .eq('id', bookingId);

      if (bookingError) {
        console.error('Error updating booking payment_status to refunded:', bookingError);
      }

      // Reverse any existing transactions for this booking
      const { error: reverseError } = await supabaseAdmin
        .from('transactions')
        .update({ status: 'reversed' })
        .eq('booking_id', bookingId)
        .in('status', ['pending', 'available']);

      if (reverseError) {
        console.error('Error reversing transactions:', reverseError);
      }

      // Notify student about refund
      const { error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: existingCharge.student_id,
          type: 'payment_refunded',
          title: 'Reembolso Processado',
          message: `Seu reembolso de R$ ${transactionAmount?.toFixed(2)} foi processado.`,
          action_url: `/aluno/aulas`,
          booking_id: bookingId,
        });

      if (notifError) {
        console.error('Error creating refund notification:', notifError);
      }
    }

    // 6) Handle rejected payments
    if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
      console.log('Payment rejected/cancelled – notifying student');

      const { error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: existingCharge.student_id,
          type: 'payment_rejected',
          title: mpStatus === 'rejected' ? 'Pagamento Recusado' : 'Pagamento Cancelado',
          message: mpStatus === 'rejected'
            ? 'Seu pagamento foi recusado. Tente novamente com outro método de pagamento.'
            : 'O pagamento foi cancelado.',
          action_url: `/aluno/aulas`,
          booking_id: bookingId,
        });

      if (notifError) {
        console.error('Error creating rejection notification:', notifError);
      }
    }

    return ok();
  } catch (error) {
    console.error('Error in mp-webhook:', error);
    return ok(); // Always 200 for MP
  }
});
