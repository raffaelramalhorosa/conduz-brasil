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

type Resolution = 'resolved_refund' | 'resolved_instructor' | 'resolved_student';

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

    // Verify caller is admin
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', userId)
      .single();

    if (callerProfile?.user_type !== 'admin') {
      return json({ error: 'Apenas administradores podem resolver disputas' }, 403);
    }

    const { dispute_id, resolution, admin_note } = await req.json();
    if (!dispute_id || !resolution) return json({ error: 'dispute_id e resolution são obrigatórios' }, 400);

    const validResolutions: Resolution[] = ['resolved_refund', 'resolved_instructor', 'resolved_student'];
    if (!validResolutions.includes(resolution)) {
      return json({ error: `Resolution inválida. Use: ${validResolutions.join(', ')}` }, 400);
    }

    // Fetch dispute and booking
    const { data: dispute, error: disputeErr } = await supabase
      .from('booking_disputes')
      .select('id, booking_id, opened_by, opened_by_type, status')
      .eq('id', dispute_id)
      .single();

    if (disputeErr || !dispute) return json({ error: 'Disputa não encontrada' }, 404);
    if (dispute.status === 'resolved_refund' || dispute.status === 'resolved_instructor' || dispute.status === 'resolved_student') {
      return json({ error: 'Esta disputa já foi resolvida' }, 400);
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('id, student_id, instructor_id, payment_status, total_price')
      .eq('id', dispute.booking_id)
      .single();

    if (!booking) return json({ error: 'Agendamento associado não encontrado' }, 404);

    const now = new Date().toISOString();

    // Process refund if needed
    if (resolution === 'resolved_refund') {
      if (['paid', 'approved', 'completed'].includes(booking.payment_status)) {
        // Delegate to process-refund edge function
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const refundRes = await fetch(`${supabaseUrl}/functions/v1/process-refund`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            booking_id: booking.id,
            student_id: booking.student_id,
            reason: 'dispute_resolved_refund',
          }),
        });

        const refundData = await refundRes.json();
        if (!refundRes.ok) {
          console.error('Refund error:', refundData);
          return json({ error: `Erro ao processar reembolso: ${refundData.error}` }, 500);
        }
      }
    }

    // Update dispute
    await supabase.from('booking_disputes').update({
      status: resolution,
      resolved_by: userId,
      resolved_at: now,
      admin_note: admin_note || null,
      updated_at: now,
    }).eq('id', dispute_id);

    // Update booking dispute fields
    await supabase.from('bookings').update({
      dispute_status: resolution,
      dispute_resolved_at: now,
      dispute_resolved_by: userId,
      dispute_admin_note: admin_note || null,
    }).eq('id', dispute.booking_id);

    // Notify both parties
    const resolutionMessages: Record<Resolution, { student: string; instructor: string }> = {
      resolved_refund: {
        student: 'Sua contestação foi resolvida. Um reembolso será processado.',
        instructor: 'A contestação da aula foi resolvida. O reembolso ao aluno foi aprovado.',
      },
      resolved_instructor: {
        student: 'Sua contestação foi analisada. O pagamento ao instrutor foi mantido.',
        instructor: 'A contestação foi resolvida a seu favor. O pagamento foi mantido.',
      },
      resolved_student: {
        student: 'Sua contestação foi resolvida favoravelmente. Nossa equipe entrará em contato.',
        instructor: 'A contestação foi resolvida. Por favor, verifique os detalhes com o suporte.',
      },
    };

    const msgs = resolutionMessages[resolution as Resolution];

    // Get student user_id
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('user_id')
      .eq('id', booking.student_id)
      .maybeSingle();

    // Get instructor user_id
    const { data: instrProfile } = await supabase
      .from('instructor_profiles')
      .select('user_id')
      .eq('id', booking.instructor_id)
      .maybeSingle();

    const notifs = [];
    if (studentProfile?.user_id) {
      notifs.push({
        user_id: studentProfile.user_id,
        type: 'dispute_resolved',
        title: 'Contestação resolvida',
        message: msgs.student,
        action_url: '/aluno/aulas',
        booking_id: booking.id,
      });
    }
    if (instrProfile?.user_id) {
      notifs.push({
        user_id: instrProfile.user_id,
        type: 'dispute_resolved',
        title: 'Contestação resolvida',
        message: msgs.instructor,
        action_url: '/admin/agendamentos',
        booking_id: booking.id,
      });
    }
    if (notifs.length) await supabase.from('notifications').insert(notifs);

    // Audit log
    try {
      await supabase.rpc('log_audit', {
        p_user_id: userId,
        p_user_type: 'admin',
        p_user_email: null,
        p_action: 'dispute.resolved',
        p_resource_type: 'booking',
        p_resource_id: dispute.booking_id,
        p_description: `Admin resolveu disputa como "${resolution}". Nota: ${admin_note}`,
        p_metadata: { dispute_id, resolution, admin_note },
      });
    } catch (e) { console.error('Audit log error:', e); }

    return json({ success: true, dispute_id, resolution });

  } catch (err) {
    console.error('resolve-dispute error:', err);
    return json({ error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
});
