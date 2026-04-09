import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Não autenticado' }, 401);

    const token = authHeader.replace('Bearer ', '').trim();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authData?.user) return json({ error: 'Token inválido' }, 401);
    const userId = authData.user.id;

    const { booking_id, latitude, longitude } = await req.json();
    if (!booking_id || latitude == null || longitude == null) {
      return json({ error: 'booking_id, latitude e longitude são obrigatórios' }, 400);
    }

    // Resolve instructor profile
    const { data: instrProfile } = await supabase
      .from('instructor_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!instrProfile) return json({ error: 'Perfil de instrutor não encontrado' }, 403);

    // Fetch booking and verify ownership
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, student_id, instructor_id, scheduled_date, start_time, status, instructor_checkin_at')
      .eq('id', booking_id)
      .single();

    if (bookingErr || !booking) return json({ error: 'Agendamento não encontrado' }, 404);
    if (booking.instructor_id !== instrProfile.id) return json({ error: 'Este agendamento não pertence a você' }, 403);
    if (booking.status !== 'confirmed') return json({ error: `Aula não está confirmada (status: ${booking.status})` }, 400);
    if (booking.instructor_checkin_at) return json({ error: 'Check-in já realizado para esta aula' }, 400);

    // Validate that lesson is today (±2h tolerance)
    const lessonStart = new Date(`${booking.scheduled_date}T${booking.start_time}`);
    const now = new Date();
    const diffMs = Math.abs(now.getTime() - lessonStart.getTime());
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours > 2) {
      return json({
        error: 'Check-in só pode ser feito no dia da aula (tolerância de ±2 horas)',
      }, 400);
    }

    // Save instructor location + set in_progress
    await supabase.from('bookings').update({
      instructor_checkin_at: now.toISOString(),
      instructor_checkin_lat: latitude,
      instructor_checkin_lng: longitude,
      status: 'in_progress',
      started_at: now.toISOString(),
    }).eq('id', booking_id);

    // Generate check-in code
    const { data: code, error: codeErr } = await supabase
      .rpc('generate_checkin_code', { p_booking_id: booking_id });

    if (codeErr || !code) {
      console.error('generate_checkin_code error:', codeErr);
      return json({ error: 'Erro ao gerar código de check-in' }, 500);
    }

    const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();

    // Resolve student user_id for notification
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('user_id')
      .eq('id', booking.student_id)
      .maybeSingle();

    if (studentProfile?.user_id) {
      await supabase.from('notifications').insert({
        user_id: studentProfile.user_id,
        type: 'checkin_requested',
        title: 'Sua aula está começando!',
        message: 'Seu instrutor iniciou a aula. Faça seu check-in para confirmar presença.',
        action_url: `/aluno/aulas`,
        booking_id,
      });
    }

    // Audit log
    try {
      await supabase.rpc('log_audit', {
        p_user_id: userId,
        p_user_type: 'instructor',
        p_user_email: null,
        p_action: 'booking.instructor_checkin',
        p_resource_type: 'booking',
        p_resource_id: booking_id,
        p_description: `Instrutor iniciou aula e registrou check-in`,
        p_metadata: { latitude, longitude, code },
      });
    } catch (e) { console.error('Audit log error:', e); }

    return json({ success: true, checkin_code: code, expires_at: expiresAt });

  } catch (err) {
    console.error('instructor-checkin error:', err);
    return json({ error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
});
