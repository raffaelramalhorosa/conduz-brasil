CREATE OR REPLACE FUNCTION public.calculate_booking_amounts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_fee_type text := 'percentage';
  v_fee_percentage numeric := 0;
  v_fee_fixed numeric := 0;
  v_min_fee numeric := 0;
  v_max_fee numeric := NULL;
  v_platform_fee numeric := 0;
  v_net_after_platform numeric := 0;
  v_school_fee numeric := 0;
BEGIN
  SELECT fee_type,
         COALESCE(platform_fee_percentage, 0),
         COALESCE(platform_fee_fixed, 0),
         COALESCE(min_fee, 0),
         max_fee
    INTO v_fee_type, v_fee_percentage, v_fee_fixed, v_min_fee, v_max_fee
  FROM public.platform_settings
  WHERE is_active = true
  ORDER BY updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    v_fee_type := 'percentage';
    v_fee_percentage := 0;
    v_fee_fixed := 0;
    v_min_fee := 0;
    v_max_fee := NULL;
  END IF;

  IF v_fee_type = 'percentage' OR v_fee_type = 'both' THEN
    v_platform_fee := v_platform_fee + (COALESCE(NEW.total_price, 0) * (v_fee_percentage / 100));
  END IF;

  IF v_fee_type = 'fixed' OR v_fee_type = 'both' THEN
    v_platform_fee := v_platform_fee + v_fee_fixed;
  END IF;

  IF v_min_fee IS NOT NULL THEN
    v_platform_fee := GREATEST(v_platform_fee, v_min_fee);
  END IF;

  IF v_max_fee IS NOT NULL THEN
    v_platform_fee := LEAST(v_platform_fee, v_max_fee);
  END IF;

  v_platform_fee := ROUND(v_platform_fee * 100) / 100;
  v_net_after_platform := GREATEST(COALESCE(NEW.total_price, 0) - v_platform_fee, 0);

  IF COALESCE(NEW.is_affiliated_booking, false) = true AND COALESCE(NEW.school_fee_rate, 0) > 0 THEN
    IF COALESCE(NEW.school_fee_type, 'percentage') = 'percentage' THEN
      v_school_fee := ROUND(v_net_after_platform * (NEW.school_fee_rate / 100) * 100) / 100;
    ELSE
      v_school_fee := LEAST(COALESCE(NEW.school_fee_rate, 0), v_net_after_platform);
    END IF;
  ELSE
    v_school_fee := 0;
  END IF;

  NEW.platform_fee := v_platform_fee;
  NEW.school_fee := v_school_fee;
  NEW.instructor_amount := ROUND((v_net_after_platform - v_school_fee) * 100) / 100;

  RETURN NEW;
END;
$function$;