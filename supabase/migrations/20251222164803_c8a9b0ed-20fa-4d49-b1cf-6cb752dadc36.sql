-- Allow students to view profiles of instructors they have bookings with
CREATE POLICY "Students can view instructor profiles with bookings"
ON profiles
FOR SELECT
USING (
  id IN (
    SELECT ip.user_id
    FROM instructor_profiles ip
    INNER JOIN bookings b ON b.instructor_id = ip.id
    INNER JOIN student_profiles sp ON sp.id = b.student_id
    WHERE sp.user_id = auth.uid()
  )
);