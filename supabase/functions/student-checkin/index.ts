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

    const { booking_id, code, latitude, longitude } = await req.json();
    if (!booking_id || !code || latitude == null || longitude == null) {
      return json({ error: 'booking_id, code, latitude e longitude são obrigatórios' }, 400);
    }

    // Resolve student profile
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!studentProfile) return json({ error: 'Perfil de aluno não encontrado' }, 403);

    // Call SQL function to validate check-in
    const { data: result, error: rpcErr } = await supabase.rpc('validate_student_checkin', {
      p_booking_id: booking_id,
      p_student_id: studentProfile.id,
      p_code: code.trim(),
      p_lat: latitude,
      p_lng: longitude,
    });

    if (rpcErr) {
      console.error('validate_student_checkin error:', rpcErr);
      return json({ error: 'Erro ao validar check-in' }, 500);
    }

    if (!result.success) {
      return json({ error: result.error }, 400);
    }

    // Notify instructor
    const { data: booking } = await supabase
      .from('bookings')
      .select('instructor_id')
      .eq('id', booking_id)
      .single();

    if (booking?.instructor_id) {
      const { data: instrProfile } = await supabase
        .from('instructor_profiles')
        .select('user_id')
        .eq('id', booking.instructor_id)
        .maybeSingle();

      if (instrProfile?.user_id) {
        await supabase.from('notifications').insert({
          user_id: instrProfile.user_id,
          type: 'student_checkedin',
          title: 'Aluno confirmou presença',
          message: result.validated
            ? `Seu aluno realizou o check-in a ${result.distance_meters}m de você. A aula está confirmada!`
            : `Seu aluno realizou o check-in, mas a localização está distante (${result.distance_meters}m).`,
          action_url: '/admin/agendamentos',
          booking_id,
        });
      }
    }

    // Audit log
    try {
      await supabase.rpc('log_audit', {
        p_user_id: userId,
        p_user_type: 'student',
        p_user_email: null,
        p_action: 'booking.student_checkin',
        p_resource_type: 'booking',
        p_resource_id: booking_id,
        p_description: `Aluno realizou check-in. Validado: ${result.validated}`,
        p_metadata: { latitude, longitude, distance_meters: result.distance_meters, validated: result.validated },
      });
    } catch (e) { console.error('Audit log error:', e); }

    return json({
      success: true,
      validated: result.validated,
      distance_meters: result.distance_meters,
      message: result.message,
    });

  } catch (err) {
    console.error('student-checkin error:', err);
    return json({ error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
});
