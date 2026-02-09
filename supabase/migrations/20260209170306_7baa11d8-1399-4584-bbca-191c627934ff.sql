-- Allow instructors to see their own vehicles (including inactive ones)
CREATE POLICY "Instrutor pode ver próprios veículos"
ON public.vehicles
FOR SELECT
USING (instructor_id IN (
  SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
));