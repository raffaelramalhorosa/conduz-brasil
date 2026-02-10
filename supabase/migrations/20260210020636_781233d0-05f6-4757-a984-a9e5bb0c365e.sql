
-- Create table for driving school dashboard customization settings
CREATE TABLE public.autoescola_dashboard_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autoescola_id uuid NOT NULL UNIQUE,
  logo_url text,
  primary_color text DEFAULT '#FF8C00',
  secondary_color text DEFAULT '#1a1a2e',
  accent_color text DEFAULT '#F59E0B',
  background_color text DEFAULT '#0f0f23',
  font_family text DEFAULT 'Inter',
  sections_order jsonb DEFAULT '["stats","agenda","alunos","financeiro","instrutores","notificacoes"]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.autoescola_dashboard_settings ENABLE ROW LEVEL SECURITY;

-- RLS: users can only read their own settings
CREATE POLICY "Autoescola pode ver próprias settings"
ON public.autoescola_dashboard_settings
FOR SELECT
USING (autoescola_id = auth.uid());

-- RLS: users can insert their own settings
CREATE POLICY "Autoescola pode criar próprias settings"
ON public.autoescola_dashboard_settings
FOR INSERT
WITH CHECK (autoescola_id = auth.uid());

-- RLS: users can update their own settings
CREATE POLICY "Autoescola pode atualizar próprias settings"
ON public.autoescola_dashboard_settings
FOR UPDATE
USING (autoescola_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_autoescola_dashboard_settings_updated_at
BEFORE UPDATE ON public.autoescola_dashboard_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('autoescola-logos', 'autoescola-logos', true);

-- Storage policies: public read
CREATE POLICY "Logos de autoescola são públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'autoescola-logos');

-- Storage policies: authenticated upload
CREATE POLICY "Autoescola pode fazer upload de logo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'autoescola-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: authenticated update
CREATE POLICY "Autoescola pode atualizar logo"
ON storage.objects FOR UPDATE
USING (bucket_id = 'autoescola-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: authenticated delete
CREATE POLICY "Autoescola pode deletar logo"
ON storage.objects FOR DELETE
USING (bucket_id = 'autoescola-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
