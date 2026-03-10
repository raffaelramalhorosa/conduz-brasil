
-- Trigger to set payment_deadline = confirmed_at + 24 hours when booking is confirmed
CREATE OR REPLACE FUNCTION public.set_payment_deadline_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When status changes to 'confirmed' and payment_status is not 'paid'
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' AND NEW.payment_status != 'paid' THEN
    NEW.payment_deadline := COALESCE(NEW.confirmed_at, now()) + INTERVAL '24 hours';
    NEW.payment_status := 'awaiting_payment';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_payment_deadline ON public.bookings;
CREATE TRIGGER trg_set_payment_deadline
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_payment_deadline_on_confirm();
