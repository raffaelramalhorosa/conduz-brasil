
-- ── 1. Auth hook ─────────────────────────────────────────────────────────────
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

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (event ->> 'user_id')::uuid
      AND role = 'admin'::app_role
  ) INTO _is_admin;

  claims := jsonb_set(claims, '{is_admin}', to_jsonb(COALESCE(_is_admin, false)));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;

-- ── 2. Update is_admin() to read from JWT claim (no DB roundtrip) ─────────────
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
ALTER TABLE public.mp_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mp_settings_public_read"  ON public.mp_settings;
DROP POLICY IF EXISTS "mp_settings_admin_read"   ON public.mp_settings;
DROP POLICY IF EXISTS "mp_settings_admin_write"  ON public.mp_settings;
DROP POLICY IF EXISTS "mp_settings_service_only" ON public.mp_settings;

CREATE POLICY "mp_settings_public_read" ON public.mp_settings
  FOR SELECT TO authenticated
  USING (key IN ('mp_environment', 'mp_prod_public_key', 'mp_sandbox_public_key'));

CREATE POLICY "mp_settings_admin_read" ON public.mp_settings
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'is_admin')::boolean = true);

CREATE POLICY "mp_settings_admin_write" ON public.mp_settings
  FOR UPDATE TO authenticated
  USING  ((auth.jwt() ->> 'is_admin')::boolean = true)
  WITH CHECK ((auth.jwt() ->> 'is_admin')::boolean = true);
