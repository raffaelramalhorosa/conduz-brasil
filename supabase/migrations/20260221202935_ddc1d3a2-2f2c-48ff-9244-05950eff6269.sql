
-- Autoescola pode ver veículos dos seus instrutores filiados
CREATE POLICY "Autoescola pode ver veículos de instrutores filiados"
  ON vehicles FOR SELECT
  USING (
    instructor_id IN (
      SELECT ip.id FROM instructor_profiles ip
      INNER JOIN driving_school_instructors dsi ON dsi.linked_user_id = ip.user_id
      WHERE dsi.driving_school_id IN (
        SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
      )
      AND dsi.status = 'active'
      AND dsi.is_account_linked = true
    )
  );

-- Autoescola pode ver pricing dos instrutores filiados
CREATE POLICY "Autoescola pode ver pricing de instrutores filiados"
  ON pricing FOR SELECT
  USING (
    instructor_id IN (
      SELECT ip.id FROM instructor_profiles ip
      INNER JOIN driving_school_instructors dsi ON dsi.linked_user_id = ip.user_id
      WHERE dsi.driving_school_id IN (
        SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
      )
      AND dsi.status = 'active'
      AND dsi.is_account_linked = true
    )
  );
