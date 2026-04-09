CREATE OR REPLACE FUNCTION auto_complete_overdue_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_record RECORD;
  end_datetime   TIMESTAMPTZ;
  new_dispute_status TEXT;
BEGIN
  FOR booking_record IN
    SELECT
      b.id,
      b.student_id,
      b.instructor_id,
      b.scheduled_date,
      b.start_time,
      b.duration_hours,
      b.status,
      b.instructor_checkin_at,
      b.student_checkin_at
    FROM bookings b
    WHERE b.status IN ('confirmed', 'in_progress')
      AND b.payment_status = 'paid'
  LOOP
    end_datetime :=
      (booking_record.scheduled_date::TEXT || ' ' || booking_record.start_time::TEXT)::TIMESTAMPTZ
      + (booking_record.duration_hours || ' hours')::INTERVAL;

    IF end_datetime < NOW() - INTERVAL '24 hours' THEN

      IF booking_record.instructor_checkin_at IS NULL AND booking_record.student_checkin_at IS NULL THEN
        new_dispute_status := 'under_review';
      ELSE
        new_dispute_status := NULL;
      END IF;

      UPDATE bookings
      SET
        status            = 'auto_completed',
        completed_at      = NOW(),
        dispute_status    = new_dispute_status,
        dispute_opened_at = CASE WHEN new_dispute_status IS NOT NULL THEN NOW() ELSE NULL END
      WHERE id = booking_record.id;

      INSERT INTO notifications (user_id, type, title, message, booking_id, action_url)
      SELECT
        sp.user_id,
        'booking_completed',
        'Aula concluída',
        CASE
          WHEN new_dispute_status = 'under_review'
          THEN 'Sua aula foi marcada como concluída automaticamente. Não detectamos check-in. Nossa equipe analisará em até 2 dias úteis.'
          ELSE 'Sua aula foi concluída automaticamente. Que tal avaliar seu instrutor?'
        END,
        booking_record.id,
        '/aluno/aulas'
      FROM student_profiles sp
      WHERE sp.id = booking_record.student_id;

      IF new_dispute_status = 'under_review' THEN
        INSERT INTO notifications (user_id, type, title, message, booking_id, action_url)
        SELECT
          p.id,
          'dispute_opened',
          'Aula sem check-in detectado',
          'Uma aula foi concluída automaticamente sem registro de check-in. Análise necessária.',
          booking_record.id,
          '/system-admin/disputas'
        FROM profiles p
        WHERE p.user_type = 'admin';
      END IF;

    END IF;
  END LOOP;
END;
$$;