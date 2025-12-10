-- Habilitar extensão PostGIS para geolocalização
CREATE EXTENSION IF NOT EXISTS postgis;

-- Adicionar colunas de geolocalização à tabela instructor_profiles
ALTER TABLE instructor_profiles
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326),
ADD COLUMN IF NOT EXISTS address_full TEXT,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE;

-- Criar índice espacial para buscas eficientes
CREATE INDEX IF NOT EXISTS idx_instructor_location 
ON instructor_profiles USING GIST (location);

-- Função para atualizar o ponto geográfico automaticamente
CREATE OR REPLACE FUNCTION update_instructor_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    NEW.last_location_update = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para atualizar location automaticamente
DROP TRIGGER IF EXISTS trigger_update_instructor_location ON instructor_profiles;
CREATE TRIGGER trigger_update_instructor_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON instructor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_instructor_location();

-- Função para buscar instrutores por proximidade
CREATE OR REPLACE FUNCTION nearby_instructors(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km INTEGER DEFAULT 10,
  min_rating DECIMAL DEFAULT 0,
  max_results INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  average_rating DECIMAL,
  total_reviews INTEGER,
  is_online BOOLEAN,
  distance_km DECIMAL,
  categories TEXT[]
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
    ip.average_rating,
    ip.total_reviews,
    ip.is_online,
    ROUND(
      ST_Distance(
        ip.location,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
      )::numeric / 1000, 2
    ) as distance_km,
    ARRAY_AGG(DISTINCT v.license_category) FILTER (WHERE v.license_category IS NOT NULL) as categories
  FROM instructor_profiles ip
  JOIN profiles p ON ip.user_id = p.id
  LEFT JOIN vehicles v ON v.instructor_id = ip.id AND v.is_active = TRUE
  WHERE 
    ip.verification_status = 'approved'
    AND ip.is_active = TRUE
    AND ip.location IS NOT NULL
    AND ip.average_rating >= min_rating
    AND ST_DWithin(
      ip.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      (radius_km * 1000)
    )
  GROUP BY ip.id, ip.user_id, p.full_name, p.avatar_url, ip.bio, ip.latitude, ip.longitude, ip.average_rating, ip.total_reviews, ip.is_online
  ORDER BY distance_km ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SET search_path = public;