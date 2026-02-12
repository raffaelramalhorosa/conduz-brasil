
-- Adicionar colunas à tabela driving_school_instructors
ALTER TABLE public.driving_school_instructors
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS license_categories text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_location_update timestamptz;

-- Criar RPC para buscar instrutores de autoescola próximos
CREATE OR REPLACE FUNCTION public.nearby_driving_school_instructors(
  user_lat numeric,
  user_lng numeric,
  radius_km int DEFAULT 20,
  max_results int DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  driving_school_id uuid,
  driving_school_name text,
  driving_school_logo text,
  instructor_name text,
  photo_url text,
  bio text,
  phone text,
  license_categories text[],
  latitude numeric,
  longitude numeric,
  distance_km numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dsi.id,
    dsi.driving_school_id,
    ip.business_name AS driving_school_name,
    ip.cover_photo_url AS driving_school_logo,
    dsi.name AS instructor_name,
    dsi.photo_url,
    dsi.bio,
    dsi.phone,
    dsi.license_categories,
    -- Se o instrutor tem localização própria, usa ela; senão herda da autoescola
    COALESCE(dsi.latitude, ip.latitude) AS latitude,
    COALESCE(dsi.longitude, ip.longitude) AS longitude,
    (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(user_lat)) * cos(radians(COALESCE(dsi.latitude, ip.latitude)))
          * cos(radians(COALESCE(dsi.longitude, ip.longitude)) - radians(user_lng))
          + sin(radians(user_lat)) * sin(radians(COALESCE(dsi.latitude, ip.latitude)))
        ))
      )
    ) AS distance_km
  FROM public.driving_school_instructors dsi
  INNER JOIN public.instructor_profiles ip ON ip.id = dsi.driving_school_id
  WHERE dsi.status = 'active'
    AND ip.is_active = true
    AND ip.verification_status = 'approved'
    AND COALESCE(dsi.latitude, ip.latitude) IS NOT NULL
    AND COALESCE(dsi.longitude, ip.longitude) IS NOT NULL
    AND (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(user_lat)) * cos(radians(COALESCE(dsi.latitude, ip.latitude)))
          * cos(radians(COALESCE(dsi.longitude, ip.longitude)) - radians(user_lng))
          + sin(radians(user_lat)) * sin(radians(COALESCE(dsi.latitude, ip.latitude)))
        ))
      )
    ) <= radius_km
  ORDER BY distance_km ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.nearby_driving_school_instructors TO anon, authenticated;
