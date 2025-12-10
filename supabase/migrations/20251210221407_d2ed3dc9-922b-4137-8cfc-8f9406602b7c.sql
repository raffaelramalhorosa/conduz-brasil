-- Tabela de AVALIAÇÕES
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  booking_id UUID UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  
  -- Avaliação geral
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  
  -- Avaliações por critério
  teaching_rating INTEGER CHECK (teaching_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  vehicle_rating INTEGER CHECK (vehicle_rating BETWEEN 1 AND 5),
  value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
  
  -- Comentário
  comment TEXT,
  
  -- Resposta do instrutor
  instructor_response TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  
  -- Tags positivas
  positive_tags TEXT[],
  
  -- Status
  is_visible BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Moderação
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_reviews_instructor ON public.reviews(instructor_id);
CREATE INDEX idx_reviews_rating ON public.reviews(overall_rating);
CREATE INDEX idx_reviews_visible ON public.reviews(is_visible);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Avaliações visíveis são públicas"
  ON public.reviews FOR SELECT
  USING (is_visible = TRUE);

CREATE POLICY "Aluno pode criar avaliação"
  ON public.reviews FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutor pode responder avaliação"
  ON public.reviews FOR UPDATE
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

-- Função para atualizar estatísticas do instrutor
CREATE OR REPLACE FUNCTION public.update_instructor_stats_after_review()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  review_count INTEGER;
BEGIN
  SELECT 
    AVG(overall_rating)::DECIMAL(3,2),
    COUNT(*)
  INTO avg_rating, review_count
  FROM public.reviews
  WHERE instructor_id = NEW.instructor_id
  AND is_visible = TRUE;
  
  UPDATE public.instructor_profiles
  SET 
    average_rating = avg_rating,
    total_reviews = review_count
  WHERE id = NEW.instructor_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, action_url)
  SELECT 
    ip.user_id,
    'review_received',
    'Nova Avaliação Recebida!',
    'Você recebeu uma avaliação de ' || NEW.overall_rating || ' estrelas.',
    '/admin/avaliacoes'
  FROM public.instructor_profiles ip
  WHERE ip.id = NEW.instructor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar stats
CREATE TRIGGER after_review_insert_or_update
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_instructor_stats_after_review();

-- Trigger para updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();