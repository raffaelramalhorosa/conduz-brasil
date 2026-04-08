-- Add notification types for instructor payment flow
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'payment_received';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'payment_released';

-- Function: notify instructors when their 24h refund window has passed
CREATE OR REPLACE FUNCTION notify_payment_released()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      pc.id        AS charge_id,
      b.instructor_id,
      b.driving_school_id,
      b.is_affiliated_booking,
      b.instructor_amount,
      b.id         AS booking_id
    FROM payment_charges pc
    JOIN bookings b ON b.id = pc.booking_id
    WHERE pc.status = 'approved'
      AND pc.refund_deadline IS NOT NULL
      AND pc.refund_deadline < NOW()
      AND pc.release_notified = false
  LOOP
    IF rec.is_affiliated_booking AND rec.driving_school_id IS NOT NULL THEN
      -- Affiliated booking → notify driving school
      INSERT INTO notifications (user_id, type, title, message, booking_id, action_url)
      SELECT
        sp.user_id,
        'payment_released',
        'Pagamento liberado',
        'O valor da aula foi liberado para sua conta Mercado Pago.',
        rec.booking_id,
        '/admin/financeiro'
      FROM school_profiles sp
      WHERE sp.id = rec.driving_school_id;
    ELSE
      -- Independent instructor
      INSERT INTO notifications (user_id, type, title, message, booking_id, action_url)
      SELECT
        ip.user_id,
        'payment_released',
        'Pagamento liberado',
        format(
          'R$%s foram liberados para sua conta Mercado Pago.',
          to_char(rec.instructor_amount, 'FM999990.00')
        ),
        rec.booking_id,
        '/admin/financeiro'
      FROM instructor_profiles ip
      WHERE ip.id = rec.instructor_id;
    END IF;

    -- Mark as notified so the cron doesn't fire again
    UPDATE payment_charges SET release_notified = true WHERE id = rec.charge_id;
  END LOOP;
END;
$$;

-- Schedule: run every hour
SELECT cron.schedule(
  'notify-payment-released',
  '0 * * * *',
  $$SELECT notify_payment_released()$$
);
