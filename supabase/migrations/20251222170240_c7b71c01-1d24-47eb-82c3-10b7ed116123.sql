-- Allow instructors to view student profiles that have bookings with them
CREATE POLICY "Instructors can view student profiles with bookings"
ON student_profiles
FOR SELECT
USING (
  id IN (
    SELECT b.student_id
    FROM bookings b
    INNER JOIN instructor_profiles ip ON ip.id = b.instructor_id
    WHERE ip.user_id = auth.uid()
  )
);