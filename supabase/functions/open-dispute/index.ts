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

    const { booking_id, reason, description } = await req.json();
    if (!booking_id || !reason) return json({ error: 'booking_id e reason são obrigatórios' }, 400);

    // Fetch booking
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, student_id, instructor_id, status, dispute_status')
      .eq('id', booking_id)
      .single();

    if (bookingErr || !booking) return json({ error: 'Agendamento não encontrado' }, 404);

    // Verify caller is student or instructor of this booking
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id, user_id')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: instrProfile } = await supabase
      .from('instructor_profiles')
      .select('id, user_id')
      .eq('user_id', userId)
      .maybeSingle();

    let callerType: 'student' | 'instructor' | null = null;
    let otherUserId: string | null = null;

    if (studentProfile && booking.student_id === studentProfile.id) {
      callerType = 'student';
      // Get instructor user_id
      const { data: ip } = await supabase
        .from('instructor_profiles')
        .select('user_id')
        .eq('id', booking.instructor_id)
        .maybeSingle();
      otherUserId = ip?.user_id ?? null;
    } else if (instrProfile && booking.instructor_id === instrProfile.id) {
      callerType = 'instructor';
      // Get student user_id
      const { data: sp } = await supabase
        .from('student_profiles')
        .select('user_id')
        .eq('id', booking.student_id)
        .maybeSingle();
      otherUserId = sp?.user_id ?? null;
    }

    if (!callerType) return json({ error: 'Você não é parte deste agendamento' }, 403);

    // Only allow disputes for in_progress/completed bookings
    const allowedStatuses = ['in_progress', 'completed', 'auto_completed'];
    if (!allowedStatuses.includes(booking.status)) {
      return json({ error: `Não é possível contestar uma aula com status "${booking.status}"` }, 400);
    }

    // Check for existing open dispute
    if (booking.dispute_status === 'open' || booking.dispute_status === 'under_review') {
      return json({ error: 'Já existe uma contestação aberta para esta aula' }, 409);
    }

    // Create dispute record
    const { data: dispute, error: disputeErr } = await supabase
      .from('booking_disputes')
      .insert({
        booking_id,
        opened_by: userId,
        opened_by_type: callerType,
        reason,
        description: description || null,
        evidence_metadata: {},
        status: 'open',
      })
      .select('id')
      .single();

    if (disputeErr || !dispute) {
      console.error('Error creating dispute:', disputeErr);
      return json({ error: 'Erro ao registrar contestação' }, 500);
    }

    // Update booking dispute_status
    await supabase.from('bookings').update({
      dispute_status: 'open',
      dispute_opened_at: new Date().toISOString(),
      dispute_opened_by: userId,
      dispute_reason: reason,
    }).eq('id', booking_id);

    // Notify the other party
    if (otherUserId) {
      await supabase.from('notifications').insert({
        user_id: otherUserId,
        type: 'dispute_opened',
        title: 'Contestação aberta',
        message: `Uma contestação foi aberta para sua aula. Nossa equipe analisará em até 2 dias úteis.`,
        action_url: callerType === 'student' ? '/admin/agendamentos' : '/aluno/aulas',
        booking_id,
      });
    }

    // Notify admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_type', 'admin');

    if (admins?.length) {
      await supabase.from('notifications').insert(
        admins.map((admin: { id: string }) => ({
          user_id: admin.id,
          type: 'dispute_opened',
          title: 'Nova contestação de aula',
          message: `Contestação #${dispute.id.slice(0, 8)} aberta por ${callerType === 'student' ? 'aluno' : 'instrutor'}. Motivo: ${reason}`,
          action_url: '/system-admin/disputas',
          booking_id,
        }))
      );
    }

    // Audit log
    try {
      await supabase.rpc('log_audit', {
        p_user_id: userId,
        p_user_type: callerType,
        p_user_email: null,
        p_action: 'dispute.opened',
        p_resource_type: 'booking',
        p_resource_id: booking_id,
        p_description: `${callerType} abriu contestação. Motivo: ${reason}`,
        p_metadata: { dispute_id: dispute.id, reason, description },
      });
    } catch (e) { console.error('Audit log error:', e); }

    return json({ success: true, dispute_id: dispute.id });

  } catch (err) {
    console.error('open-dispute error:', err);
    return json({ error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
});
