
-- 1.1 Colunas de check-in em bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS checkin_code             TEXT,
  ADD COLUMN IF NOT EXISTS checkin_code_expires_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS instructor_checkin_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS instructor_checkin_lat   NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS instructor_checkin_lng   NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS student_checkin_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS student_checkin_lat      NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS student_checkin_lng      NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS checkin_distance_meters  INTEGER,
  ADD COLUMN IF NOT EXISTS checkin_validated        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS class_started_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS class_ended_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispute_status           TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dispute_opened_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispute_opened_by        UUID,
  ADD COLUMN IF NOT EXISTS dispute_reason           TEXT,
  ADD COLUMN IF NOT EXISTS dispute_resolved_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispute_resolved_by      UUID,
  ADD COLUMN IF NOT EXISTS dispute_admin_note       TEXT;

-- Validation trigger for dispute_status instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_dispute_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.dispute_status IS NOT NULL AND NEW.dispute_status NOT IN (
    'open','under_review','resolved_instructor',
    'resolved_student','resolved_refund'
  ) THEN
    RAISE EXCEPTION 'Invalid dispute_status: %', NEW.dispute_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_dispute_status
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_dispute_status();

-- 1.2 Ampliar CHECK constraint de notificações
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'booking_request',
    'booking_confirmed',
    'booking_cancelled',
    'booking_reminder',
    'review_received',
    'payment_received',
    'payment_confirmed',
    'payment_refunded',
    'payment_rejected',
    'payment_released',
    'booking_completed',
    'booking_rejected',
    'affiliated_lesson_completed',
    'checkin_requested',
    'student_checkedin',
    'dispute_opened',
    'dispute_resolved'
  ));

-- 1.3 Tabela de disputas
CREATE TABLE IF NOT EXISTS public.booking_disputes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID        NOT NULL REFERENCES public.bookings(id),
  opened_by         UUID        NOT NULL,
  opened_by_type    TEXT        NOT NULL CHECK (opened_by_type IN ('student','instructor')),
  reason            TEXT        NOT NULL,
  description       TEXT,
  evidence_metadata JSONB       DEFAULT '{}',
  status            TEXT        NOT NULL DEFAULT 'open'
    CHECK (status IN (
      'open','under_review','resolved_instructor',
      'resolved_student','resolved_refund'
    )),
  admin_note        TEXT,
  resolved_by       UUID,
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dispute_own_read" ON public.booking_disputes
  FOR SELECT TO authenticated
  USING (opened_by = auth.uid());

CREATE POLICY "dispute_service_write" ON public.booking_disputes
  FOR ALL TO service_role
  USING (true);

-- 1.4 Função: gerar código de check-in
CREATE OR REPLACE FUNCTION public.generate_checkin_code(p_booking_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_code TEXT;
BEGIN
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

  UPDATE public.bookings
  SET checkin_code            = v_code,
      checkin_code_expires_at = now() + INTERVAL '4 hours',
      class_started_at        = now()
  WHERE id = p_booking_id;

  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_checkin_code TO service_role;

-- 1.5 Função: validar check-in do aluno (Haversine)
CREATE OR REPLACE FUNCTION public.validate_student_checkin(
  p_booking_id UUID,
  p_student_id UUID,
  p_code       TEXT,
  p_lat        NUMERIC,
  p_lng        NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_booking   RECORD;
  v_distance  NUMERIC;
  v_validated BOOLEAN;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id AND student_id = p_student_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agendamento não encontrado');
  END IF;

  IF v_booking.checkin_code IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Instrutor ainda não iniciou a aula');
  END IF;

  IF v_booking.checkin_code_expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código expirado. Peça ao instrutor para gerar um novo.');
  END IF;

  IF v_booking.checkin_code != p_code THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido');
  END IF;

  IF v_booking.student_checkin_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Check-in já realizado');
  END IF;

  IF v_booking.instructor_checkin_lat IS NULL OR v_booking.instructor_checkin_lng IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Localização do instrutor não disponível');
  END IF;

  v_distance := (
    6371000.0 * acos(
      GREATEST(-1.0, LEAST(1.0,
        cos(radians(v_booking.instructor_checkin_lat::FLOAT)) *
        cos(radians(p_lat::FLOAT)) *
        cos(radians(p_lng::FLOAT) - radians(v_booking.instructor_checkin_lng::FLOAT)) +
        sin(radians(v_booking.instructor_checkin_lat::FLOAT)) *
        sin(radians(p_lat::FLOAT))
      ))
    )
  );

  v_validated := v_distance < 300;

  UPDATE public.bookings
  SET student_checkin_at      = now(),
      student_checkin_lat     = p_lat,
      student_checkin_lng     = p_lng,
      checkin_distance_meters = v_distance::INTEGER,
      checkin_validated       = v_validated
  WHERE id = p_booking_id;

  PERFORM public.log_audit(
    p_student_id, 'student', NULL,
    'booking.student_checkin', 'booking', p_booking_id,
    'Aluno realizou check-in. Distância: ' || v_distance::INTEGER || 'm. Validado: ' || v_validated,
    jsonb_build_object(
      'lat', p_lat, 'lng', p_lng,
      'distance_meters', v_distance::INTEGER,
      'validated', v_validated
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'validated', v_validated,
    'distance_meters', v_distance::INTEGER,
    'message', CASE WHEN v_validated
      THEN 'Check-in confirmado! Boa aula!'
      ELSE 'Check-in registrado. Sua localização parece estar longe do instrutor.'
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_student_checkin TO authenticated, service_role;
