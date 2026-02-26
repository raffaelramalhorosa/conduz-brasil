
-- Fix search_path on the validation function
CREATE OR REPLACE FUNCTION validate_platform_settings_fee_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.fee_type NOT IN ('percentage', 'fixed', 'both') THEN
    RAISE EXCEPTION 'fee_type must be percentage, fixed, or both';
  END IF;
  RETURN NEW;
END;
$$;
