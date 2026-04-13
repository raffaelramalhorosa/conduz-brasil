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

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === AUTENTICAÇÃO JWT — student_id não é aceito do body ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userToken = authHeader.replace('Bearer ', '');

    const { booking_id } = await req.json();

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: 'booking_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Verificar identidade do chamador via JWT
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(userToken);
    if (authError || !authData?.user?.id) {
      return new Response(JSON.stringify({ error: 'Token inválido ou expirado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerUserId = authData.user.id;

    // Buscar student_profile do chamador — impede impersonação
    const { data: studentProfile } = await supabaseAdmin
      .from('student_profiles')
      .select('id, user_id')
      .eq('user_id', callerUserId)
      .single();

    if (!studentProfile) {
      return new Response(JSON.stringify({ error: 'Perfil de aluno não encontrado' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const student_id = callerUserId; // user_id usado para notificações

    // Fetch booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, student_id, total_price, payment_status, instructor_id, scheduled_date, start_time')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Verificar que o chamador é o aluno deste booking
    if (booking.student_id !== studentProfile.id) {
      return new Response(JSON.stringify({ error: 'Você não tem permissão para reportar ausência neste agendamento' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (booking.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'Este agendamento não está pago' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Verify lesson time has passed
    const lessonDateTime = new Date(`${booking.scheduled_date}T${booking.start_time}`);
    if (lessonDateTime > new Date()) {
      return new Response(
        JSON.stringify({ error: 'O horário da aula ainda não passou' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Get MP payment ID
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

    // Get MP credentials
    const creds = await getMpCredentials(supabaseAdmin);
    if (!creds.accessToken) {
      return new Response(
        JSON.stringify({ error: 'Token do Mercado Pago não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Process refund via MP
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${charge.mp_payment_id}/refunds`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${creds.accessToken}`,
        },
        body: JSON.stringify({}),
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
    console.log(`No-show refund created: MP refund ID ${mpRefundId} for booking ${booking_id}`);

    // Update booking
    await supabaseAdmin.from('bookings').update({
      instructor_no_show: true,
      no_show_reported_at: new Date().toISOString(),
      no_show_reported_by: student_id,
      status: 'cancelled',
      payment_status: 'refunded',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'Instrutor não compareceu',
    }).eq('id', booking_id);

    // Update payment charges
    await supabaseAdmin.from('payment_charges').update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
    }).eq('booking_id', booking_id).eq('status', 'approved');

    // Reverse transactions
    await supabaseAdmin.from('transactions').update({
      status: 'reversed',
    }).eq('booking_id', booking_id).in('status', ['pending', 'available']);

    // Create refund record (student_id = student_profile UUID, not auth user_id)
    await supabaseAdmin.from('refunds').insert({
      booking_id,
      student_id: booking.student_id,
      amount: booking.total_price,
      reason: 'instructor_no_show',
      status: 'approved',
      mp_refund_id: mpRefundId,
    });

    // Notify student (user_id = auth user_id)
    await supabaseAdmin.from('notifications').insert({
      user_id: callerUserId,
      type: 'refund_approved',
      title: 'Reembolso por Ausência do Instrutor',
      message: `Seu reembolso de R$ ${booking.total_price?.toFixed(2)} foi processado. O valor volta em até 10 dias úteis.`,
      action_url: '/aluno/reembolsos',
      booking_id,
    });

    // Get instructor user_id for notification
    const { data: instructorProfile } = await supabaseAdmin
      .from('instructor_profiles')
      .select('user_id')
      .eq('id', booking.instructor_id)
      .single();

    if (instructorProfile) {
      await supabaseAdmin.from('notifications').insert({
        user_id: instructorProfile.user_id,
        type: 'no_show_reported',
        title: 'Ausência Reportada',
        message: 'Um aluno reportou que você não compareceu à aula. Um reembolso foi processado automaticamente.',
        action_url: '/admin/agendamentos',
        booking_id,
      });
    }

    return new Response(
      JSON.stringify({ success: true, mp_refund_id: mpRefundId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in process-no-show:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
