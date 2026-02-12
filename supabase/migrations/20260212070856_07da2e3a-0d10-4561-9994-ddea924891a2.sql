
CREATE OR REPLACE FUNCTION public.get_affiliation_info(p_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  is_affiliated boolean,
  driving_school_name text,
  driving_school_logo text,
  driving_school_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dsi.linked_user_id AS user_id,
    true AS is_affiliated,
    ip.business_name AS driving_school_name,
    ip.cover_photo_url AS driving_school_logo,
    ip.id AS driving_school_id
  FROM driving_school_instructors dsi
  INNER JOIN instructor_profiles ip ON ip.id = dsi.driving_school_id
  WHERE dsi.linked_user_id = ANY(p_user_ids)
    AND dsi.status = 'active'
    AND dsi.is_account_linked = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_affiliation_info(uuid[]) TO anon;
GRANT EXECUTE ON FUNCTION public.get_affiliation_info(uuid[]) TO authenticated;
