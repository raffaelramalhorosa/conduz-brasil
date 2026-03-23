CREATE OR REPLACE FUNCTION public.nearby_instructors(
  user_lat numeric,
  user_lng numeric,
  radius_km int DEFAULT 20,
  min_rating numeric DEFAULT 0,
  max_results int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  avatar_url text,
  bio text,
  latitude numeric,
  longitude numeric,
  average_rating numeric,
  total_reviews int,
  is_online boolean,
  distance_km numeric,
  categories text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ip.id,
    ip.user_id,
    p.full_name,
    p.avatar_url,
    ip.bio,
    ip.latitude,
    ip.longitude,
    COALESCE(ip.average_rating, 0) AS average_rating,
    COALESCE(ip.total_reviews, 0) AS total_reviews,
    COALESCE(ip.is_online, false) AS is_online,
    (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(user_lat)) * cos(radians(ip.latitude))
          * cos(radians(ip.longitude) - radians(user_lng))
          + sin(radians(user_lat)) * sin(radians(ip.latitude))
        ))
      )
    ) AS distance_km,
    COALESCE(
      ARRAY(
        SELECT DISTINCT v.license_category
        FROM public.vehicles v
        WHERE v.instructor_id = ip.id
          AND v.is_active = true
        ORDER BY v.license_category
      ),
      '{}'::text[]
    ) AS categories
  FROM public.instructor_profiles ip
  INNER JOIN public.profiles p ON p.id = ip.user_id
  WHERE ip.is_active = true
    AND ip.verification_status = 'approved'
    AND COALESCE(ip.is_driving_school, false) = false
    AND ip.latitude IS NOT NULL
    AND ip.longitude IS NOT NULL
    AND (min_rating = 0 OR COALESCE(ip.average_rating, 0) >= min_rating)
    AND (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(user_lat)) * cos(radians(ip.latitude))
          * cos(radians(ip.longitude) - radians(user_lng))
          + sin(radians(user_lat)) * sin(radians(ip.latitude))
        ))
      )
    ) <= radius_km
  ORDER BY distance_km ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION public.nearby_instructors TO anon, authenticated;