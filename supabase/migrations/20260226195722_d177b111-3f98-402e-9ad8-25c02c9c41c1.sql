-- Fix platform fee on existing bookings (should be 5% not 12%)
-- For total_price=100: platform_fee=5, school_fee=(100-5)*0.09=8.55, instructor_amount=100-5-8.55=86.45
UPDATE bookings 
SET 
  platform_fee = 5.00,
  school_fee = 8.55,
  instructor_amount = 86.45
WHERE id IN ('aa6aff30-4472-4332-b9cf-001f516f0445', '0636f9b6-b14e-4d81-98cb-79b7ea331190');
