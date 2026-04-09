-- ============================================================
-- Auto-complete overdue bookings with check-in awareness
-- ============================================================

-- Update the auto_complete function to be check-in aware.
-- Logic:
--   - No check-in at all → auto_completed + dispute_status='under_review' + notify admin
--   - Instructor checked in (aluno não) → auto_completed normally (instructor showed up)
--   - Both checked in → auto_completed normally
-- Also extends to handle 'in_progress' bookings (instructor started but never finished)

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
    -- Calculate scheduled end time
    end_datetime :=
      (booking_record.scheduled_date::TEXT || ' ' || booking_record.start_time::TEXT)::TIMESTAMPTZ
      + (booking_record.duration_hours || ' hours')::INTERVAL;

    -- Auto-complete only after 24h past scheduled end
    IF end_datetime < NOW() - INTERVAL '24 hours' THEN

      -- Determine dispute status based on check-in evidence
      IF booking_record.instructor_checkin_at IS NULL AND booking_record.student_checkin_at IS NULL THEN
        -- No check-in from either party: flag for admin review
        new_dispute_status := 'under_review';
      ELSE
        -- At least instructor checked in: distribute normally
        new_dispute_status := NULL;
      END IF;

      -- Mark booking as auto_completed
      UPDATE bookings
      SET
        status            = 'auto_completed',
        completed_at      = NOW(),
        dispute_status    = new_dispute_status,
        dispute_opened_at = CASE WHEN new_dispute_status IS NOT NULL THEN NOW() ELSE NULL END
      WHERE id = booking_record.id;

      -- Notify student
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

      -- If no check-in detected: notify admins for review
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

-- Ensure 'auto_completed' and 'under_review' dispute_status don't break the completed tab on the student side
-- (no schema change needed — status is TEXT with no enum constraint)
