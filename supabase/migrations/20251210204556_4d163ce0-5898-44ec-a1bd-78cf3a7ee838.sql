-- Tabela de perfis de INSTRUTORES
CREATE TABLE public.instructor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cpf TEXT UNIQUE,
  cnpj TEXT UNIQUE,
  is_driving_school BOOLEAN DEFAULT FALSE,
  business_name TEXT,
  bio TEXT,
  experience_years INTEGER,
  cnh_number TEXT,
  instructor_license TEXT,
  
  -- Endereço
  zipcode TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  
  -- Documentação URLs
  cnh_front_url TEXT,
  cnh_back_url TEXT,
  instructor_license_url TEXT,
  business_license_url TEXT,
  
  -- Status
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Estatísticas
  total_classes INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5,2) DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  -- Disponibilidade geral
  available_morning BOOLEAN DEFAULT TRUE,
  available_afternoon BOOLEAN DEFAULT TRUE,
  available_evening BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de perfis de ALUNOS
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cpf TEXT UNIQUE,
  date_of_birth DATE,
  
  -- Endereço
  zipcode TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  
  -- Preferências
  preferred_transmission TEXT CHECK (preferred_transmission IN ('manual', 'automatic', 'both')),
  has_anxiety BOOLEAN DEFAULT FALSE,
  needs_adapted_vehicle BOOLEAN DEFAULT FALSE,
  preferred_language TEXT DEFAULT 'pt-br',
  
  -- Estatísticas
  total_classes_taken INTEGER DEFAULT 0,
  favorite_instructors UUID[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de ESPECIALIDADES dos instrutores
CREATE TABLE public.instructor_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL CHECK (specialty IN (
    'first_license',
    'renewal',
    'anxious_students',
    'elderly',
    'english_classes',
    'defensive_driving',
    'night_classes'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instructor_id, specialty)
);

-- Tabela de DISPONIBILIDADE SEMANAL
CREATE TABLE public.instructor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instructor_id, day_of_week, start_time)
);

-- Enable RLS
ALTER TABLE public.instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_availability ENABLE ROW LEVEL SECURITY;

-- Policies para instructor_profiles
CREATE POLICY "Instrutores podem ver próprio perfil"
  ON public.instructor_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Instrutores podem inserir próprio perfil"
  ON public.instructor_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Instrutores podem atualizar próprio perfil"
  ON public.instructor_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Perfis de instrutores aprovados são públicos"
  ON public.instructor_profiles FOR SELECT
  USING (verification_status = 'approved' AND is_active = TRUE);

-- Policies para student_profiles
CREATE POLICY "Alunos podem ver próprio perfil"
  ON public.student_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Alunos podem inserir próprio perfil"
  ON public.student_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Alunos podem atualizar próprio perfil"
  ON public.student_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Policies para instructor_specialties
CREATE POLICY "Especialidades são públicas para leitura"
  ON public.instructor_specialties FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Instrutor pode inserir próprias especialidades"
  ON public.instructor_specialties FOR INSERT
  WITH CHECK (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutor pode atualizar próprias especialidades"
  ON public.instructor_specialties FOR UPDATE
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutor pode deletar próprias especialidades"
  ON public.instructor_specialties FOR DELETE
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

-- Policies para instructor_availability
CREATE POLICY "Disponibilidade é pública para leitura"
  ON public.instructor_availability FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Instrutor pode inserir própria disponibilidade"
  ON public.instructor_availability FOR INSERT
  WITH CHECK (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutor pode atualizar própria disponibilidade"
  ON public.instructor_availability FOR UPDATE
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutor pode deletar própria disponibilidade"
  ON public.instructor_availability FOR DELETE
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

-- Triggers para atualizar updated_at
CREATE TRIGGER update_instructor_profiles_updated_at
  BEFORE UPDATE ON public.instructor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();