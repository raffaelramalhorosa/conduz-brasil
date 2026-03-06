import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function getMpAccessToken(supabaseAdmin: ReturnType<typeof createClient>): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('mp_environment_settings')
    .select('environment')
    .limit(1)
    .maybeSingle();
  const env = data?.environment || 'sandbox';
  return env === 'production'
    ? Deno.env.get('MERCADOPAGO_PUBLIC_ACESSTOKEN_PROD') || null
    : Deno.env.get('MERCADOPAGO_PUBLIC_ACESSTOKEN') || null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

    // Get booking + charge info
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, student_id, total_price, payment_status, active_charge_id')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (booking.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'Este agendamento não está pago' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Get the MP payment ID from the charge
    const { data: charge } = await supabaseAdmin
      .from('payment_charges')
      .select('mp_payment_id')
      .eq('booking_id', booking_id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!charge?.mp_payment_id) {
      console.error('No MP payment ID found for booking:', booking_id);
      return new Response(
        JSON.stringify({ error: 'ID do pagamento no Mercado Pago não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Call MP Refund API
    const mpAccessToken = await getMpAccessToken(supabaseAdmin);
    if (!mpAccessToken) {
      return new Response(
        JSON.stringify({ error: 'Token do Mercado Pago não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${charge.mp_payment_id}/refunds`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mpAccessToken}`,
        },
        body: JSON.stringify({}), // full refund
      },
    );

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      console.error('MP refund error:', JSON.stringify(mpData));
      return new Response(
        JSON.stringify({ error: 'Erro ao processar reembolso no Mercado Pago', details: mpData }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const mpRefundId = String(mpData.id);
    console.log(`Refund created: MP refund ID ${mpRefundId} for booking ${booking_id}`);

    // Update booking payment_status
    await supabaseAdmin
      .from('bookings')
      .update({ payment_status: 'refunded' })
      .eq('id', booking_id);

    // Update payment_charges
    await supabaseAdmin
      .from('payment_charges')
      .update({ status: 'refunded', refunded_at: new Date().toISOString() })
      .eq('booking_id', booking_id)
      .eq('status', 'approved');

    // Reverse transactions
    await supabaseAdmin
      .from('transactions')
      .update({ status: 'reversed' })
      .eq('booking_id', booking_id)
      .in('status', ['pending', 'available']);

    // If a refund record was provided, update it
    if (refund_id) {
      await supabaseAdmin
        .from('refunds')
        .update({
          status: 'approved',
          mp_refund_id: mpRefundId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', refund_id);
    }

    // Notify student
    await supabaseAdmin
      .from('notifications')
      .insert({
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
