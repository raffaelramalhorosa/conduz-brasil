
-- Drop existing instructor UPDATE policy and recreate with driving_school_id restriction
DROP POLICY IF EXISTS "Instrutores podem atualizar agendamentos" ON public.bookings;

-- Instructor can only update bookings that are DIRECT (no driving school involved)
CREATE POLICY "Instrutores podem atualizar agendamentos diretos"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (
    driving_school_id IS NULL
    AND instructor_id IN (
      SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
    )
  );

-- School can already update via existing policy "Autoescola pode atualizar bookings dos seus instrutores filiado"
-- No changes needed there
