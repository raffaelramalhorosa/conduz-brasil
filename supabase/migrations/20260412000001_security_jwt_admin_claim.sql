-- ============================================================
-- Security: embed is_admin in JWT via custom_access_token hook
-- ============================================================
-- After running this migration you MUST register the hook:
--   Supabase Dashboard → Authentication → Hooks → custom_access_token
--   → select function: public.custom_access_token_hook

-- ── 1. Auth hook ─────────────────────────────────────────────────────────────
-- Embeds is_admin into every signed JWT at token-issue time.
-- The claim is cryptographically signed — cannot be spoofed by
-- intercepting/modifying HTTP responses.
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims    jsonb;
  _is_admin boolean := false;
BEGIN
  claims := event -> 'claims';

  SELECT (user_type = 'admin')
    INTO _is_admin
    FROM public.profiles
   WHERE id = (event ->> 'user_id')::uuid;

  claims := jsonb_set(claims, '{is_admin}', to_jsonb(COALESCE(_is_admin, false)));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;

-- ── 2. Update is_admin() to read from JWT claim (no DB roundtrip) ─────────────
-- All existing RLS policies calling is_admin() automatically benefit.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() ->> 'is_admin')::boolean, false);
$$;

-- ── 3. mp_settings row-level security ────────────────────────────────────────
-- Sensitive rows (access_token, client_secret) must NEVER reach the browser.
-- Public keys and environment are safe for authenticated reads.

ALTER TABLE public.mp_settings ENABLE ROW LEVEL SECURITY;

-- Drop any previous policies
DROP POLICY IF EXISTS "mp_settings_public_read"  ON public.mp_settings;
DROP POLICY IF EXISTS "mp_settings_admin_read"   ON public.mp_settings;
DROP POLICY IF EXISTS "mp_settings_admin_write"  ON public.mp_settings;
DROP POLICY IF EXISTS "mp_settings_service_only" ON public.mp_settings;

-- Authenticated users can read only non-sensitive keys (MP SDK needs public_key + environment)
CREATE POLICY "mp_settings_public_read" ON public.mp_settings
  FOR SELECT TO authenticated
  USING (key IN ('mp_environment', 'mp_prod_public_key', 'mp_sandbox_public_key'));

-- Admins (verified via JWT claim) can read everything — needed for the settings panel
CREATE POLICY "mp_settings_admin_read" ON public.mp_settings
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'is_admin')::boolean = true);

-- Only admins can update settings — writes from PlatformSettings.tsx go through here
CREATE POLICY "mp_settings_admin_write" ON public.mp_settings
  FOR UPDATE TO authenticated
  USING  ((auth.jwt() ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() ->> 'is_admin')::boolean = true);

-- service_role bypasses RLS entirely — edge functions are unaffected
