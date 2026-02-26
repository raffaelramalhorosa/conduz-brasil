
-- Platform settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_fee_percentage numeric NOT NULL DEFAULT 0,
  platform_fee_fixed numeric NOT NULL DEFAULT 0,
  fee_type text NOT NULL DEFAULT 'percentage',
  min_fee numeric DEFAULT 0,
  max_fee numeric,
  is_active boolean DEFAULT true,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION validate_platform_settings_fee_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fee_type NOT IN ('percentage', 'fixed', 'both') THEN
    RAISE EXCEPTION 'fee_type must be percentage, fixed, or both';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_fee_type
  BEFORE INSERT OR UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION validate_platform_settings_fee_type();

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can view platform settings" ON platform_settings FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admins can update platform settings" ON platform_settings FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admins can insert platform settings" ON platform_settings FOR INSERT TO authenticated WITH CHECK (is_admin());

-- All authenticated can read active settings (for fee calculation)
CREATE POLICY "All authenticated can read active settings" ON platform_settings FOR SELECT TO authenticated USING (is_active = true);

-- Insert default row
INSERT INTO platform_settings (platform_fee_percentage, fee_type) VALUES (0, 'percentage');
