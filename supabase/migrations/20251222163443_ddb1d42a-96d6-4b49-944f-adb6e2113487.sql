-- Drop the restrictive policy
DROP POLICY IF EXISTS "Public instructor profiles are visible to all" ON profiles;

-- Recreate as PERMISSIVE policy (default)
CREATE POLICY "Public instructor profiles are visible to all"
ON profiles
FOR SELECT
USING (user_type = ANY (ARRAY['instructor'::user_type, 'driving_school'::user_type]));