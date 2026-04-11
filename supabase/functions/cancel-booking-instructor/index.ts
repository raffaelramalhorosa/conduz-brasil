import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Método não permitido' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Token de autenticação ausente' }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    // === AUTENTICAR ===
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return jsonResponse({ error: 'Não autorizado' }, 401);

    const { booking_id, reason } = await req.json();
    if (!booking_id) return jsonResponse({ error: 'booking_id é obrigatório' }, 400);
    if (!reason || reason.trim().length < 3) return jsonResponse({ error: 'Motivo do cancelamento é obrigatório' }, 400);

    // === BUSCAR PERFIL DO INSTRUTOR ===
    const { data: instructorProfile } = await supabaseAdmin
      .from('instructor_profiles')
      .select('id, user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!instructorProfile) return jsonResponse({ error: 'Perfil de instrutor não encontrado' }, 403);

    // === BUSCAR BOOKING ===
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        student_id,
        instructor_id,
        driving_school_id,
        is_affiliated_booking,
        total_price,
        status,
        payment_status,
        scheduled_date,
        start_time,
        duration_hours,
        active_charge_id,
        student_profiles!student_id (
          user_id,
          profiles!user_id ( full_name, email )
        )
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) return jsonResponse({ error: 'Agendamento não encontrado' }, 404);

    // === VALIDAR OWNERSHIP ===
    // Instrutor direto ou escola vinculada
    const isOwner =
      booking.instructor_id === instructorProfile.id ||
      (booking.is_affiliated_booking && booking.driving_school_id === instructorProfile.id);

    if (!isOwner) return jsonResponse({ error: 'Você não tem permissão para cancelar este agendamento' }, 403);

    // === VALIDAR STATUS ===
    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(booking.status)) {
      return jsonResponse({
        error: `Não é possível cancelar uma aula com status '${booking.status}'`,
      }, 400);
    }

    // === CANCELAR BOOKING ===
    const { error: cancelError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled_by_instructor',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason.trim(),
      })
      .eq('id', booking_id);

    if (cancelError) {
      console.error('Erro ao cancelar booking:', cancelError);
      return jsonResponse({ error: 'Erro ao cancelar agendamento' }, 500);
    }

    console.log(`Booking ${booking_id} cancelado pelo instrutor ${instructorProfile.id}`);

    const studentUserId = (booking.student_profiles as any)?.user_id;
    const studentName = (booking.student_profiles as any)?.profiles?.full_name || 'Aluno';
    const studentEmail = (booking.student_profiles as any)?.profiles?.email;

    let refundTriggered = false;
    let refundError: string | null = null;

    // === SE PAGO: PROCESSAR REEMBOLSO ===
    const paidStatuses = ['paid', 'approved'];
    if (paidStatuses.includes(booking.payment_status)) {
      console.log(`Booking pago (${booking.payment_status}), iniciando reembolso...`);

      // Criar registro de reembolso
      const { data: refundRecord, error: refundInsertError } = await supabaseAdmin
        .from('refunds')
        .insert({
          booking_id,
          student_id: booking.student_id,
          amount: booking.total_price,
          reason: 'instructor_cancellation',
          status: 'pending',
        } as any)
        .select('id')
        .single();

      if (refundInsertError) {
        console.error('Erro ao criar registro de reembolso:', refundInsertError);
      }

      // Chamar process-refund
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

      const refundRes = await fetch(`${supabaseUrl}/functions/v1/process-refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          booking_id,
          student_id: studentUserId || booking.student_id,
          reason: 'instructor_cancellation',
          refund_id: refundRecord?.id || null,
        }),
      });

      const refundData = await refundRes.json();

      if (!refundRes.ok) {
        refundError = refundData.error || 'Erro ao processar reembolso';
        console.error('Erro no reembolso:', refundError, refundData);

        // Notificar admin sobre falha no reembolso
        await supabaseAdmin.from('notifications').insert({
          user_id: user.id,
          type: 'payment_refunded',
          title: 'Falha no reembolso automático',
          message: `Houve um erro ao processar o reembolso para o agendamento ${booking_id}. Contate o suporte.`,
          action_url: '/admin/financeiro',
          booking_id,
        });
      } else {
        refundTriggered = true;
        console.log('Reembolso processado com sucesso:', refundData.mp_refund_id);
      }
    }

    // === NOTIFICAR ALUNO ===
    if (studentUserId) {
      await supabaseAdmin.from('notifications').insert({
        user_id: studentUserId,
        type: 'booking_cancelled',
        title: 'Aula cancelada pelo instrutor',
        message: refundTriggered
          ? `Sua aula foi cancelada pelo instrutor. O reembolso de R$ ${booking.total_price?.toFixed(2)} será processado em até 10 dias úteis.`
          : `Sua aula foi cancelada pelo instrutor. Motivo: ${reason.trim()}.`,
        action_url: '/aluno/aulas',
        booking_id,
      });
    }

    // === AUDIT LOG ===
    try {
      const { data: instrProfile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      await supabaseAdmin.rpc('log_audit', {
        p_user_id: user.id,
        p_user_type: 'instructor',
        p_user_email: instrProfile?.email || null,
        p_action: 'booking.cancelled_by_instructor',
        p_resource_type: 'booking',
        p_resource_id: booking_id,
        p_description: `Aula cancelada pelo instrutor. Motivo: ${reason.trim()}`,
        p_metadata: {
          booking_id,
          reason: reason.trim(),
          was_paid: paidStatuses.includes(booking.payment_status),
          refund_triggered: refundTriggered,
        },
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    return jsonResponse({
      success: true,
      refund_triggered: refundTriggered,
      refund_error: refundError,
      message: refundTriggered
        ? 'Aula cancelada e reembolso iniciado com sucesso.'
        : 'Aula cancelada com sucesso.',
    });

  } catch (err) {
    console.error('cancel-booking-instructor error:', err);
    return jsonResponse({ error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
});
