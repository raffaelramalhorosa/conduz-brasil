CREATE POLICY "Instrutor vinculado pode ver proprio vinculo"
ON public.driving_school_instructors
FOR SELECT
USING (linked_user_id = auth.uid());