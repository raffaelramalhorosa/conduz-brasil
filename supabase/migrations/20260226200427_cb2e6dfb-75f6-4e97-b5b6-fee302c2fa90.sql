
-- Fix all bookings to use 5% platform fee
-- For school_fee_rate = 9: school_fee = (100 - 5) * 0.09 = 8.55, instructor = 95 - 8.55 = 86.45
-- For school_fee_rate = 90: school_fee = (100 - 5) * 0.90 = 85.50, instructor = 95 - 85.50 = 9.50
UPDATE bookings SET 
  platform_fee = ROUND(total_price * 0.05 * 100) / 100,
  school_fee = CASE 
    WHEN is_affiliated_booking = true AND COALESCE(school_fee_rate, 0) > 0 
    THEN ROUND((total_price - ROUND(total_price * 0.05 * 100) / 100) * (school_fee_rate / 100) * 100) / 100
    ELSE 0
  END,
  instructor_amount = CASE 
    WHEN is_affiliated_booking = true AND COALESCE(school_fee_rate, 0) > 0 
    THEN ROUND(((total_price - ROUND(total_price * 0.05 * 100) / 100) - ROUND((total_price - ROUND(total_price * 0.05 * 100) / 100) * (school_fee_rate / 100) * 100) / 100) * 100) / 100
    ELSE ROUND((total_price - ROUND(total_price * 0.05 * 100) / 100) * 100) / 100
  END,
  updated_at = now();
