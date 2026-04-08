import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * distribute-payment — registro contábil da distribuição do split.
 *
 * Com o modelo MP Marketplace, o split financeiro real acontece no momento
 * do pagamento (marketplace_fee + collector_id na preference). Esta função
 * apenas registra o log contábil para auditoria interna.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id, mp_payment_id, transaction_amount } = await req.json();

    if (!booking_id || !mp_payment_id || !transaction_amount) {
      return new Response(
        JSON.stringify({ error: 'booking_id, mp_payment_id e transaction_amount são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Fetch booking for fee data
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('instructor_id, driving_school_id, is_affiliated_booking, platform_fee, instructor_amount, total_price')
      .eq('id', booking_id)
      .single();

    if (bookingErr || !booking) {
      console.error('Booking not found:', booking_id, bookingErr);
      return new Response(
        JSON.stringify({ error: 'Booking não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const gross_cents = Math.round(transaction_amount * 100);
    const platform_fee_cents = Math.round((booking.platform_fee ?? 0) * 100);
    const instructor_cents = Math.round((booking.instructor_amount ?? (transaction_amount - (booking.platform_fee ?? 0))) * 100);
    const school_commission_cents = gross_cents - platform_fee_cents - instructor_cents;

    console.log('Distribuição contábil (MP Marketplace):', {
      booking_id,
      mp_payment_id,
      gross_cents,
      platform_fee_cents,
      school_commission_cents,
      instructor_cents,
      is_affiliated: booking.is_affiliated_booking,
    });

    return new Response(
      JSON.stringify({
        success: true,
        gross_cents,
        platform_fee_cents,
        school_commission_cents,
        instructor_cents,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in distribute-payment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
