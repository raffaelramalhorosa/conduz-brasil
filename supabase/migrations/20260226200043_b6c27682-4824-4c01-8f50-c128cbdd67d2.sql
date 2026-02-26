
CREATE OR REPLACE FUNCTION public.recalculate_pending_bookings_fees(
  p_fee_type text,
  p_fee_percentage numeric,
  p_fee_fixed numeric
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer := 0;
  rec record;
  new_platform_fee numeric;
  net_after_platform numeric;
  new_school_fee numeric;
  new_instructor_amount numeric;
BEGIN
  FOR rec IN
    SELECT b.id, b.total_price, b.is_affiliated_booking, b.school_fee_rate, b.school_fee_type
    FROM bookings b
    WHERE b.status IN ('pending', 'confirmed', 'accepted_by_school')
  LOOP
    -- Calculate new platform fee
    new_platform_fee := 0;
    IF p_fee_type = 'percentage' OR p_fee_type = 'both' THEN
      new_platform_fee := new_platform_fee + rec.total_price * (p_fee_percentage / 100);
    END IF;
    IF p_fee_type = 'fixed' OR p_fee_type = 'both' THEN
      new_platform_fee := new_platform_fee + p_fee_fixed;
    END IF;
    new_platform_fee := ROUND(new_platform_fee * 100) / 100;

    -- Calculate school fee on net after platform
    net_after_platform := rec.total_price - new_platform_fee;
    new_school_fee := 0;
    
    IF rec.is_affiliated_booking = true AND COALESCE(rec.school_fee_rate, 0) > 0 THEN
      IF COALESCE(rec.school_fee_type, 'percentage') = 'percentage' THEN
        new_school_fee := ROUND(net_after_platform * (rec.school_fee_rate / 100) * 100) / 100;
      ELSE
        new_school_fee := LEAST(rec.school_fee_rate, net_after_platform);
      END IF;
    END IF;

    new_instructor_amount := ROUND((net_after_platform - new_school_fee) * 100) / 100;

    UPDATE bookings
    SET platform_fee = new_platform_fee,
        school_fee = new_school_fee,
        instructor_amount = new_instructor_amount,
        updated_at = now()
    WHERE id = rec.id;

    updated_count := updated_count + 1;
  END LOOP;

  RETURN updated_count;
END;
$$;
