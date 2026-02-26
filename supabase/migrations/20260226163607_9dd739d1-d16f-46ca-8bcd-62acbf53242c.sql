
CREATE OR REPLACE FUNCTION public.school_can_view_conversation(conv_instructor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM driving_school_instructors dsi
    JOIN instructor_profiles ip ON ip.user_id = dsi.linked_user_id
    WHERE dsi.driving_school_id IN (
      SELECT instructor_profiles.id FROM instructor_profiles WHERE instructor_profiles.user_id = auth.uid()
    )
    AND ip.id = conv_instructor_id
    AND dsi.status = 'active'
    AND dsi.is_account_linked = true
  );
$$;

CREATE POLICY "School can view affiliated instructor conversations"
ON public.conversations
FOR SELECT
USING (school_can_view_conversation(instructor_id));
