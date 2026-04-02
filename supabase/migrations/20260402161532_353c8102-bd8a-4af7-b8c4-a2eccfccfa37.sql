
ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'booking_request',
    'booking_confirmed',
    'booking_cancelled',
    'booking_reminder',
    'booking_completed',
    'booking_rejected',
    'review_received',
    'payment_received'
  ]));
