-- Add onboarding_completed column to instructor_profiles
ALTER TABLE public.instructor_profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Create index for faster queries on onboarding status
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_onboarding 
ON public.instructor_profiles(user_id, onboarding_completed);

-- Create a function to cleanup abandoned accounts (accounts created more than 24h ago without completed onboarding)
CREATE OR REPLACE FUNCTION public.cleanup_abandoned_accounts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Delete instructor profiles older than 24 hours with incomplete onboarding
  WITH abandoned_instructors AS (
    SELECT user_id 
    FROM instructor_profiles 
    WHERE onboarding_completed = false 
    AND created_at < NOW() - INTERVAL '24 hours'
  ),
  deleted_profiles AS (
    DELETE FROM instructor_profiles 
    WHERE user_id IN (SELECT user_id FROM abandoned_instructors)
    RETURNING user_id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted_profiles;

  -- Note: The actual auth.users deletion should be handled via Supabase Admin API
  -- This function just cleans up the related data in public schema

  RETURN deleted_count;
END;
$$;

-- Create a helper function to check if instructor has completed onboarding
CREATE OR REPLACE FUNCTION public.has_completed_onboarding(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT onboarding_completed FROM instructor_profiles WHERE user_id = check_user_id),
    false
  );
$$;