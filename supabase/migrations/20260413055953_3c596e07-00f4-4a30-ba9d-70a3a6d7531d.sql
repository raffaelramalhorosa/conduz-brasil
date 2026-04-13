
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS pricing_id UUID REFERENCES public.pricing(id);

CREATE OR REPLACE FUNCTION public.calculate_booking_amounts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pr   RECORD;
  v_ps   RECORD;
BEGIN
  IF NEW.pricing_id IS NOT NULL THEN
    SELECT single_class_price,
           package_5_price,
           package_10_price,
           package_20_price
      INTO v_pr
      FROM public.pricing
     WHERE id = NEW.pricing_id
       AND is_active = TRUE;

    IF FOUND THEN
      CASE COALESCE(NEW.package_type, 'single')
        WHEN 'single'     THEN NEW.total_price := v_pr.single_class_price;
        WHEN 'package_5'  THEN NEW.total_price := COALESCE(v_pr.package_5_price,  v_pr.single_class_price * 5);
        WHEN 'package_10' THEN NEW.total_price := COALESCE(v_pr.package_10_price, v_pr.single_class_price * 10);
        WHEN 'package_20' THEN NEW.total_price := COALESCE(v_pr.package_20_price, v_pr.single_class_price * 20);
        ELSE                   NEW.total_price := v_pr.single_class_price;
      END CASE;
      NEW.price_per_hour := v_pr.single_class_price;
    END IF;
  END IF;

  SELECT fee_type, platform_fee_percentage, platform_fee_fixed
    INTO v_ps
    FROM public.platform_settings
   ORDER BY updated_at DESC
   LIMIT 1;

  IF FOUND THEN
    CASE v_ps.fee_type
      WHEN 'percentage' THEN
        NEW.platform_fee := ROUND((NEW.total_price * COALESCE(v_ps.platform_fee_percentage, 0) / 100)::NUMERIC, 2);
      WHEN 'fixed' THEN
        NEW.platform_fee := COALESCE(v_ps.platform_fee_fixed, 0);
      WHEN 'both' THEN
        NEW.platform_fee := ROUND((
          NEW.total_price * COALESCE(v_ps.platform_fee_percentage, 0) / 100
          + COALESCE(v_ps.platform_fee_fixed, 0)
        )::NUMERIC, 2);
      ELSE
        NEW.platform_fee := ROUND((NEW.total_price * 0.12)::NUMERIC, 2);
    END CASE;
  ELSE
    NEW.platform_fee := ROUND((NEW.total_price * 0.12)::NUMERIC, 2);
  END IF;

  NEW.instructor_amount := ROUND((NEW.total_price - NEW.platform_fee)::NUMERIC, 2);

  RETURN NEW;
END;
$$;
