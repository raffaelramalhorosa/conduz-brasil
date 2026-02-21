
CREATE OR REPLACE FUNCTION public.instructor_has_booking_with_student(student_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM bookings b
    INNER JOIN instructor_profiles ip ON (ip.id = b.instructor_id OR ip.id = b.driving_school_id)
    INNER JOIN student_profiles sp ON sp.id = b.student_id
    WHERE ip.user_id = auth.uid()
      AND sp.user_id = student_user_id
  )
$$;
