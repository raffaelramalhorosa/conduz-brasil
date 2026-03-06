
-- Key-value table for MP credentials
CREATE TABLE IF NOT EXISTS public.mp_credentials (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.mp_credentials ENABLE ROW LEVEL SECURITY;

-- Only admins can manage credentials
CREATE POLICY "Admins can read mp_credentials"
  ON public.mp_credentials FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert mp_credentials"
  ON public.mp_credentials FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update mp_credentials"
  ON public.mp_credentials FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert initial empty records
INSERT INTO public.mp_credentials (key, value) VALUES
  ('mp_environment', 'sandbox'),
  ('mp_sandbox_access_token', ''),
  ('mp_sandbox_public_key', ''),
  ('mp_sandbox_client_id', ''),
  ('mp_sandbox_client_secret', ''),
  ('mp_prod_access_token', ''),
  ('mp_prod_public_key', ''),
  ('mp_prod_client_id', ''),
  ('mp_prod_client_secret', '')
ON CONFLICT (key) DO NOTHING;
