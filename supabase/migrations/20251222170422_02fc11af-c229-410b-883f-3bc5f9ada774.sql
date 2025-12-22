-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Instructors can view student profiles with bookings" ON profiles;
DROP POLICY IF EXISTS "Students can view instructor profiles with bookings" ON profiles;
DROP POLICY IF EXISTS "Instructors can view student profiles with bookings" ON student_profiles;

-- Create security definer functions to avoid recursion

-- Function to check if user is an instructor with bookings from a specific student
CREATE OR REPLACE FUNCTION public.instructor_has_booking_with_student(student_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM bookings b
    INNER JOIN instructor_profiles ip ON ip.id = b.instructor_id
    INNER JOIN student_profiles sp ON sp.id = b.student_id
    WHERE ip.user_id = auth.uid()
      AND sp.user_id = student_user_id
  )
$$;

-- Function to check if user is a student with bookings from a specific instructor
CREATE OR REPLACE FUNCTION public.student_has_booking_with_instructor(instructor_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM bookings b
    INNER JOIN student_profiles sp ON sp.id = b.student_id
    INNER JOIN instructor_profiles ip ON ip.id = b.instructor_id
    WHERE sp.user_id = auth.uid()
      AND ip.user_id = instructor_user_id
  )
$$;

-- Function to check if instructor can see a student profile by student_profiles.id
CREATE OR REPLACE FUNCTION public.instructor_has_booking_with_student_profile(student_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM bookings b
    INNER JOIN instructor_profiles ip ON ip.id = b.instructor_id
    WHERE ip.user_id = auth.uid()
      AND b.student_id = student_profile_id
  )
$$;

-- Recreate policies using the security definer functions
CREATE POLICY "Instructors can view student profiles with bookings"
ON profiles
FOR SELECT
USING (public.instructor_has_booking_with_student(id));

CREATE POLICY "Students can view instructor profiles with bookings"
ON profiles
FOR SELECT
USING (public.student_has_booking_with_instructor(id));

CREATE POLICY "Instructors can view student profiles with bookings"
ON student_profiles
FOR SELECT
USING (public.instructor_has_booking_with_student_profile(id));