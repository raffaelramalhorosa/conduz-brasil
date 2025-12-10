-- Tabela de AGENDAMENTOS
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  
  -- Detalhes da aula
  license_category TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  
  -- Localização
  pickup_address TEXT NOT NULL,
  pickup_latitude DECIMAL(10,8),
  pickup_longitude DECIMAL(11,8),
  
  -- Valores
  price_per_hour DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  instructor_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Status do agendamento
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled_by_student',
    'cancelled_by_instructor',
    'no_show_student',
    'no_show_instructor'
  )),
  
  -- Mensagens
  student_message TEXT,
  instructor_message TEXT,
  cancellation_reason TEXT,
  
  -- Timestamps importantes
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de NOTIFICAÇÕES
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN (
    'booking_request',
    'booking_confirmed',
    'booking_cancelled',
    'booking_reminder',
    'review_received',
    'payment_received'
  )),
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  action_url TEXT,
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_bookings_student ON public.bookings(student_id);
CREATE INDEX idx_bookings_instructor ON public.bookings(instructor_id);
CREATE INDEX idx_bookings_date ON public.bookings(scheduled_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies para bookings
CREATE POLICY "Alunos podem ver próprios agendamentos"
  ON public.bookings FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutores podem ver próprios agendamentos"
  ON public.bookings FOR SELECT
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Alunos podem criar agendamentos"
  ON public.bookings FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutores podem atualizar agendamentos"
  ON public.bookings FOR UPDATE
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Alunos podem atualizar próprios agendamentos"
  ON public.bookings FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
    )
  );

-- Policies para notifications
CREATE POLICY "Usuários veem próprias notificações"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Sistema pode criar notificações"
  ON public.notifications FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Usuários podem atualizar próprias notificações"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Função para criar notificações automáticas
CREATE OR REPLACE FUNCTION public.create_booking_notifications()
RETURNS TRIGGER AS $$
DECLARE
  instructor_user_id UUID;
  student_user_id UUID;
BEGIN
  SELECT user_id INTO instructor_user_id 
  FROM public.instructor_profiles WHERE id = NEW.instructor_id;
  
  SELECT user_id INTO student_user_id 
  FROM public.student_profiles WHERE id = NEW.student_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, message, booking_id, action_url)
    VALUES (
      instructor_user_id,
      'booking_request',
      'Nova Solicitação de Aula',
      'Você recebeu uma nova solicitação de aula!',
      NEW.id,
      '/admin/agendamentos'
    );
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'confirmed' THEN
    INSERT INTO public.notifications (user_id, type, title, message, booking_id, action_url)
    VALUES (
      student_user_id,
      'booking_confirmed',
      'Aula Confirmada!',
      'Seu instrutor confirmou a aula. Prepare-se!',
      NEW.id,
      '/aluno/aulas'
    );
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status LIKE 'cancelled%' THEN
    IF NEW.status = 'cancelled_by_student' THEN
      INSERT INTO public.notifications (user_id, type, title, message, booking_id)
      VALUES (
        instructor_user_id,
        'booking_cancelled',
        'Aula Cancelada',
        'O aluno cancelou a aula agendada.',
        NEW.id
      );
    ELSIF NEW.status = 'cancelled_by_instructor' THEN
      INSERT INTO public.notifications (user_id, type, title, message, booking_id)
      VALUES (
        student_user_id,
        'booking_cancelled',
        'Aula Cancelada',
        'O instrutor cancelou a aula. Entre em contato para reagendar.',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para notificações
CREATE TRIGGER on_booking_change
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_booking_notifications();

-- Função para calcular valores do agendamento
CREATE OR REPLACE FUNCTION public.calculate_booking_amounts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.platform_fee := NEW.total_price * 0.12;
  NEW.instructor_amount := NEW.total_price - NEW.platform_fee;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER calculate_amounts_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_booking_amounts();

-- Trigger para updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();