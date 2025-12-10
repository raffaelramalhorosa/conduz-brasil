-- Tabela de VEÍCULOS
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  license_plate TEXT NOT NULL,
  color TEXT,
  
  -- Tipo e categoria
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'motorcycle', 'truck')),
  license_category TEXT NOT NULL CHECK (license_category IN ('A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE')),
  
  -- Características
  transmission TEXT NOT NULL CHECK (transmission IN ('manual', 'automatic')),
  has_air_conditioning BOOLEAN DEFAULT FALSE,
  has_power_steering BOOLEAN DEFAULT FALSE,
  is_adapted BOOLEAN DEFAULT FALSE,
  adaptation_type TEXT,
  
  -- Fotos
  main_photo_url TEXT,
  additional_photos TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Documentação
  crlv_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de PREÇOS por veículo/categoria
CREATE TABLE public.pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  license_category TEXT NOT NULL,
  
  -- Preços
  single_class_price DECIMAL(10,2) NOT NULL,
  package_5_price DECIMAL(10,2),
  package_10_price DECIMAL(10,2),
  package_20_price DECIMAL(10,2),
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(instructor_id, vehicle_id, license_category)
);

-- Tabela de ÁREAS DE ATENDIMENTO
CREATE TABLE public.service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  neighborhoods TEXT[],
  max_distance_km INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instructor_id, city, state)
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;

-- Policies para vehicles
CREATE POLICY "Veículos ativos são públicos"
  ON public.vehicles FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Instrutor pode inserir próprios veículos"
  ON public.vehicles FOR INSERT
  WITH CHECK (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutor pode atualizar próprios veículos"
  ON public.vehicles FOR UPDATE
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutor pode deletar próprios veículos"
  ON public.vehicles FOR DELETE
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

-- Policies para pricing
CREATE POLICY "Preços ativos são públicos"
  ON public.pricing FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Instrutor pode inserir próprios preços"
  ON public.pricing FOR INSERT
  WITH CHECK (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutor pode atualizar próprios preços"
  ON public.pricing FOR UPDATE
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutor pode deletar próprios preços"
  ON public.pricing FOR DELETE
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

-- Policies para service_areas
CREATE POLICY "Áreas de atendimento são públicas"
  ON public.service_areas FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Instrutor pode inserir próprias áreas"
  ON public.service_areas FOR INSERT
  WITH CHECK (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutor pode atualizar próprias áreas"
  ON public.service_areas FOR UPDATE
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutor pode deletar próprias áreas"
  ON public.service_areas FOR DELETE
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_updated_at
  BEFORE UPDATE ON public.pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();