-- Enable pg_cron extension (required for scheduled jobs)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add booking_completed notification type
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_completed';

-- Function: auto-complete overdue confirmed bookings (24h after scheduled end time)
CREATE OR REPLACE FUNCTION auto_complete_overdue_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_record RECORD;
  end_datetime TIMESTAMPTZ;
BEGIN
  FOR booking_record IN
    SELECT
      b.id,
      b.student_id,
      b.instructor_id,
      b.scheduled_date,
      b.start_time,
      b.duration_hours
    FROM bookings b
    WHERE b.status = 'confirmed'
      AND b.payment_status = 'paid'
  LOOP
    -- Calculate end datetime: scheduled_date + start_time + duration
    end_datetime :=
      (booking_record.scheduled_date::TEXT || ' ' || booking_record.start_time::TEXT)::TIMESTAMPTZ
      + (booking_record.duration_hours || ' hours')::INTERVAL;

    -- Auto-complete only if more than 24h have passed since scheduled end
    IF end_datetime < NOW() - INTERVAL '24 hours' THEN

      -- Mark booking as completed (existing trigger creates financial transaction)
      UPDATE bookings
      SET
        status       = 'completed',
        completed_at = NOW()
      WHERE id = booking_record.id;

      -- Notify the student
      INSERT INTO notifications (user_id, type, title, message, booking_id, action_url)
      SELECT
        sp.user_id,
        'booking_completed',
        'Aula concluída',
        'Sua aula foi concluída automaticamente. Que tal avaliar seu instrutor?',
        booking_record.id,
        '/aluno/aulas'
      FROM student_profiles sp
      WHERE sp.id = booking_record.student_id;

    END IF;
  END LOOP;
END;
$$;

-- Schedule: runs every day at 05:00 UTC (02:00 BRT)
SELECT cron.schedule(
  'auto-complete-overdue-bookings',
  '0 5 * * *',
  $$SELECT auto_complete_overdue_bookings()$$
);
