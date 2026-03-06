CREATE TABLE IF NOT EXISTS public.mp_environment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.mp_environment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mp_environment_settings"
ON public.mp_environment_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read mp_environment_settings"
ON public.mp_environment_settings
FOR SELECT
TO authenticated
USING (true);

-- Insert default sandbox value
INSERT INTO public.mp_environment_settings (environment) VALUES ('sandbox');