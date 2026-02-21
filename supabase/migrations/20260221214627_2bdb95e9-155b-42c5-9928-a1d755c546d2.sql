
-- Create SECURITY DEFINER function to get current user's instructor profile ID without triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_instructor_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_instructor_profile_id FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_instructor_profile_id TO authenticated;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Autoescola pode ver perfis de instrutores filiados" ON public.instructor_profiles;

-- Recreate using the SECURITY DEFINER function
CREATE POLICY "Autoescola pode ver perfis de instrutores filiados"
ON public.instructor_profiles
FOR SELECT
USING (
  id IN (
    SELECT ip.id
    FROM instructor_profiles ip
    JOIN driving_school_instructors dsi ON dsi.linked_user_id = ip.user_id
    WHERE dsi.driving_school_id = public.get_my_instructor_profile_id()
      AND dsi.status = 'active'
      AND dsi.is_account_linked = true
  )
);
