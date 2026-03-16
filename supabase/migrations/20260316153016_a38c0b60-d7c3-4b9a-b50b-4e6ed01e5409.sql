CREATE POLICY "Admins can view all student profiles"
ON public.student_profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));