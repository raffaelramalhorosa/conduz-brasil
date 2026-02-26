CREATE OR REPLACE FUNCTION public.user_is_part_of_booking(p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM bookings b
    WHERE b.id = p_booking_id
    AND (
      b.student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
      OR
      b.instructor_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid())
      OR
      (b.is_affiliated_booking = true AND b.driving_school_id IN (
        SELECT id FROM instructor_profiles WHERE user_id = auth.uid() AND is_driving_school = true
      ))
    )
  );
$$;