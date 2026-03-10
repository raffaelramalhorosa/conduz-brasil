import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Find expired bookings
    const { data: expiredBookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        student_id,
        instructor_id,
        total_price,
        payment_deadline,
        instructor_profiles!bookings_instructor_id_fkey (
          user_id,
          profiles!inner ( full_name )
        ),
        student_profiles:student_id (
          user_id,
          profiles:user_id ( full_name )
        )
      `)
      .eq('status', 'confirmed')
      .eq('payment_status', 'awaiting_payment')
      .lt('payment_deadline', new Date().toISOString());

    if (error) {
      console.error('Error fetching expired bookings:', error);
      throw error;
    }

    if (!expiredBookings || expiredBookings.length === 0) {
      console.log('No expired bookings found');
      return new Response(
        JSON.stringify({ expired: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`Found ${expiredBookings.length} expired bookings`);

    let expiredCount = 0;

    for (const booking of expiredBookings) {
      try {
        // Update booking status
        await supabaseAdmin
          .from('bookings')
          .update({
            status: 'cancelled',
            payment_status: 'expired',
            cancelled_at: new Date().toISOString(),
            cancellation_reason: 'Pagamento não realizado no prazo de 24h',
          })
          .eq('id', booking.id);

        const instructorProfile = booking.instructor_profiles as any;
        const studentProfile = booking.student_profiles as any;
        const instructorName = instructorProfile?.profiles?.full_name || 'instrutor';
        const studentName = studentProfile?.profiles?.full_name || 'aluno';

        // Notify student
        if (studentProfile?.user_id) {
          await supabaseAdmin.from('notifications').insert({
            user_id: studentProfile.user_id,
            type: 'payment_expired',
            title: 'Reserva Expirada',
            message: `Sua reserva com ${instructorName} expirou pois o pagamento não foi realizado no prazo de 24h.`,
            action_url: '/aluno/aulas',
            booking_id: booking.id,
          });
        }

        // Notify instructor
        if (instructorProfile?.user_id) {
          await supabaseAdmin.from('notifications').insert({
            user_id: instructorProfile.user_id,
            type: 'payment_expired',
            title: 'Reserva Cancelada',
            message: `A reserva com ${studentName} foi cancelada por falta de pagamento.`,
            action_url: '/admin/agendamentos',
            booking_id: booking.id,
          });
        }

        expiredCount++;
        console.log(`Expired booking ${booking.id}`);
      } catch (bookingErr) {
        console.error(`Error expiring booking ${booking.id}:`, bookingErr);
      }
    }

    return new Response(
      JSON.stringify({ expired: expiredCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in check-payment-expiry:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
