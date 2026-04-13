-- ============================================================
-- Security: lock financial columns against client tampering
-- ============================================================
-- Problem: the RLS UPDATE policy for bookings only restricts WHICH row
-- a user can update, not WHICH columns. A student could therefore call:
--   supabase.from('bookings').update({ payment_status: 'paid' })...
-- and the DB would accept it.
--
-- Fix: a BEFORE UPDATE trigger that raises an exception when an
-- authenticated client (auth.uid() IS NOT NULL) tries to change any of
-- the financial columns that must only be written by edge functions
-- running with the service_role key (auth.uid() IS NULL in that context).

CREATE OR REPLACE FUNCTION public.prevent_financial_column_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service-role callers (edge functions using SUPABASE_SERVICE_ROLE_KEY)
  -- bypass RLS and have auth.uid() = NULL. Allow them unconditionally.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- From this point on we are handling an authenticated client request.
  -- Block changes to any column that controls money flow.

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
