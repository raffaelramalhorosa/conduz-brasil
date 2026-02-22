
-- 1. Criar função que retorna os IDs dos instrutores filiados SEM tocar em instructor_profiles
CREATE OR REPLACE FUNCTION public.get_affiliated_instructor_profile_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ip.id 
  FROM public.instructor_profiles ip
  JOIN public.driving_school_instructors dsi ON dsi.linked_user_id = ip.user_id
  WHERE dsi.driving_school_id = (
    SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid() LIMIT 1
  )
  AND dsi.status = 'active'
  AND dsi.is_account_linked = true;
$$;

REVOKE EXECUTE ON FUNCTION public.get_affiliated_instructor_profile_ids FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_affiliated_instructor_profile_ids TO authenticated;

-- 2. Dropar a policy problemática
DROP POLICY IF EXISTS "Autoescola pode ver perfis de instrutores filiados" ON public.instructor_profiles;

-- 3. Recriar SEM subquery em instructor_profiles — usa a função SECURITY DEFINER
CREATE POLICY "Autoescola pode ver perfis de instrutores filiados"
ON public.instructor_profiles
FOR SELECT
USING (
  id IN (SELECT public.get_affiliated_instructor_profile_ids())
);
