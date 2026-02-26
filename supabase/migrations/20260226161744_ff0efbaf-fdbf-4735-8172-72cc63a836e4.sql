
CREATE POLICY "Instrutor vinculado pode atualizar proprio registro para desvincular"
ON public.driving_school_instructors
FOR UPDATE
USING (linked_user_id = auth.uid())
WITH CHECK (linked_user_id = auth.uid());
