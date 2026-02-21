
-- Allow driving schools to view instructor profiles of their affiliated instructors
CREATE POLICY "Autoescola pode ver perfis de instrutores filiados"
ON public.instructor_profiles
FOR SELECT
USING (
  id IN (
    SELECT ip.id
    FROM instructor_profiles ip
    JOIN driving_school_instructors dsi ON dsi.linked_user_id = ip.user_id
    WHERE dsi.driving_school_id IN (
      SELECT instructor_profiles.id
      FROM instructor_profiles
      WHERE instructor_profiles.user_id = auth.uid()
    )
    AND dsi.status = 'active'
    AND dsi.is_account_linked = true
  )
);
