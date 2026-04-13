
CREATE OR REPLACE FUNCTION public.prevent_financial_column_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.payment_status   IS DISTINCT FROM OLD.payment_status   THEN
    RAISE EXCEPTION 'payment_status cannot be modified directly (booking %)' , OLD.id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.total_price       IS DISTINCT FROM OLD.total_price       THEN
    RAISE EXCEPTION 'total_price cannot be modified directly (booking %)', OLD.id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.platform_fee      IS DISTINCT FROM OLD.platform_fee      THEN
    RAISE EXCEPTION 'platform_fee cannot be modified directly (booking %)', OLD.id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.instructor_amount IS DISTINCT FROM OLD.instructor_amount THEN
    RAISE EXCEPTION 'instructor_amount cannot be modified directly (booking %)', OLD.id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.price_per_hour    IS DISTINCT FROM OLD.price_per_hour    THEN
    RAISE EXCEPTION 'price_per_hour cannot be modified directly (booking %)', OLD.id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lock_financial_columns
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_financial_column_tampering();
