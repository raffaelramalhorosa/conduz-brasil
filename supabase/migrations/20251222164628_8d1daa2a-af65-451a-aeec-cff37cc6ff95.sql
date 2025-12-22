-- Allow instructors to view profiles of students who have bookings with them
CREATE POLICY "Instructors can view student profiles with bookings"
ON profiles
FOR SELECT
USING (
  id IN (
    SELECT sp.user_id
    FROM student_profiles sp
    INNER JOIN bookings b ON b.student_id = sp.id
    INNER JOIN instructor_profiles ip ON ip.id = b.instructor_id
    WHERE ip.user_id = auth.uid()
  )
);