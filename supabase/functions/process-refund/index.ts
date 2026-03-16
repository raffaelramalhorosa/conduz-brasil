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

    const { booking_id, student_id, reason, refund_id } = await req.json();

    if (!booking_id || !student_id) {
      return new Response(
        JSON.stringify({ error: 'booking_id e student_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Buscar booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, student_id, instructor_id, total_price, payment_status, active_charge_id')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Aceitar qualquer status que indique pagamento realizado
    const paidStatuses = ['paid', 'approved', 'completed'];
    if (!paidStatuses.includes(booking.payment_status)) {
      console.error('Booking payment_status inválido para reembolso:', booking.payment_status);
      return new Response(
        JSON.stringify({ error: 'Este agendamento não está pago', payment_status: booking.payment_status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Buscar charge aprovada
    const { data: charge } = await supabaseAdmin
      .from('payment_charges')
      .select('mp_payment_id')
      .eq('booking_id', booking_id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!charge?.mp_payment_id) {
      console.error('mp_payment_id não encontrado para booking:', booking_id);
      return new Response(
        JSON.stringify({ error: 'ID do pagamento no Mercado Pago não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('mp_payment_id para reembolso:', charge.mp_payment_id);

    // Buscar token OAuth do instrutor — o pagamento pertence à conta dele no MP
    const { data: mpAccount } = await supabaseAdmin
      .from('mp_connected_accounts')
      .select('mp_access_token, mp_user_id')
      .eq('instructor_id', booking.instructor_id)
      .eq('is_active', true)
      .maybeSingle();

    if (!mpAccount?.mp_access_token) {
      console.error('Token OAuth do instrutor não encontrado:', booking.instructor_id);
      return new Response(
        JSON.stringify({ error: 'Token do instrutor não encontrado para processar reembolso' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('Usando token do instrutor para reembolso, mp_user_id:', mpAccount.mp_user_id);

    const idempotencyKey = `refund_${booking_id}_${Date.now()}`;

    // Chamar API de reembolso com token do instrutor
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${charge.mp_payment_id}/refunds`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mpAccount.mp_access_token}`,
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({}),
      },
    );

    const mpData = await mpRes.json();
    console.log('Resposta MP refund status:', mpRes.status);
    console.log('Resposta MP refund:', JSON.stringify(mpData));

    if (!mpRes.ok) {
      console.error('MP refund error:', JSON.stringify(mpData));
      return new Response(
        JSON.stringify({ error: 'Erro ao processar reembolso no Mercado Pago', details: mpData }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const mpRefundId = String(mpData.id);
    console.log(`Reembolso criado: MP refund ID ${mpRefundId} para booking ${booking_id}`);

    // Atualizar banco de dados
    await supabaseAdmin
      .from('bookings')
      .update({ payment_status: 'refunded' })
      .eq('id', booking_id);

    await supabaseAdmin
      .from('payment_charges')
      .update({ status: 'refunded', refunded_at: new Date().toISOString() })
      .eq('booking_id', booking_id)
      .eq('status', 'approved');

    await supabaseAdmin
      .from('transactions')
      .update({ status: 'reversed' })
      .eq('booking_id', booking_id)
      .in('status', ['pending', 'available']);

    if (refund_id) {
      await supabaseAdmin.from('refunds').update({
        status: 'approved',
        mp_refund_id: mpRefundId,
        updated_at: new Date().toISOString(),
      }).eq('id', refund_id);
    }

    // Notificar aluno
    await supabaseAdmin.from('notifications').insert({
      user_id: student_id,
      type: 'refund_approved',
      title: 'Reembolso Aprovado',
      message: `Seu reembolso de R$ ${booking.total_price?.toFixed(2)} foi aprovado. O valor volta em até 10 dias úteis.`,
      action_url: '/aluno/reembolsos',
      booking_id,
    });

    return new Response(
      JSON.stringify({ success: true, mp_refund_id: mpRefundId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (error) {
    console.error('Error in process-refund:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
