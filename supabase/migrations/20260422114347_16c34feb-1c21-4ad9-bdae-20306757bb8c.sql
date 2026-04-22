CREATE OR REPLACE FUNCTION public.clear_orphaned_cnpj(p_cnpj TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  orphaned_id UUID;
BEGIN
  SELECT id INTO orphaned_id
  FROM instructor_profiles
  WHERE cnpj = p_cnpj
    AND user_id != p_user_id
    AND onboarding_completed = false
  LIMIT 1;

  IF orphaned_id IS NOT NULL THEN
    UPDATE instructor_profiles SET cnpj = NULL WHERE id = orphaned_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;