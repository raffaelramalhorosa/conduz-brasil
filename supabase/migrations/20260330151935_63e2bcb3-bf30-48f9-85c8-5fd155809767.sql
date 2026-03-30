
-- Tabela de audit logs
CREATE TABLE public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID,
  user_type       TEXT,
  user_email      TEXT,
  action          TEXT NOT NULL,
  resource_type   TEXT,
  resource_id     UUID,
  description     TEXT,
  metadata        JSONB DEFAULT '{}',
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_audit_user     ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action   ON public.audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_date     ON public.audit_logs(created_at DESC);

-- RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_admin_read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "audit_service_write" ON public.audit_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Função helper
CREATE OR REPLACE FUNCTION public.log_audit(
  p_user_id      UUID,
  p_user_type    TEXT,
  p_user_email   TEXT,
  p_action       TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id  UUID DEFAULT NULL,
  p_description  TEXT DEFAULT NULL,
  p_metadata     JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id, user_type, user_email,
    action, resource_type, resource_id,
    description, metadata
  ) VALUES (
    p_user_id, p_user_type, p_user_email,
    p_action, p_resource_type, p_resource_id,
    p_description, p_metadata
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_audit TO service_role;

-- Trigger bookings
CREATE OR REPLACE FUNCTION public.audit_booking_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit(
      NEW.student_id, 'student', NULL,
      'booking.created', 'booking', NEW.id,
      'Aula agendada',
      jsonb_build_object(
        'instructor_id', NEW.instructor_id,
        'scheduled_date', NEW.scheduled_date,
        'total_price', NEW.total_price,
        'status', NEW.status
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM public.log_audit(
        COALESCE(NEW.student_id, NEW.instructor_id), 
        'system', NULL,
        'booking.status_changed', 'booking', NEW.id,
        'Status alterado de ' || COALESCE(OLD.status, 'null') || ' para ' || NEW.status,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'payment_status', NEW.payment_status
        )
      );
    END IF;
    IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
      PERFORM public.log_audit(
        NEW.student_id, 'system', NULL,
        'booking.payment_changed', 'booking', NEW.id,
        'Pagamento: ' || COALESCE(OLD.payment_status, 'null') || ' → ' || NEW.payment_status,
        jsonb_build_object(
          'old_payment_status', OLD.payment_status,
          'new_payment_status', NEW.payment_status
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_bookings
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.audit_booking_changes();

-- Trigger payment_charges
CREATE OR REPLACE FUNCTION public.audit_payment_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.log_audit(
      NEW.student_id, 'system', NULL,
      'payment.' || NEW.status, 'payment', NEW.id,
      'Pagamento ' || NEW.status,
      jsonb_build_object(
        'booking_id', NEW.booking_id,
        'mp_payment_id', NEW.mp_payment_id,
        'value_cents', NEW.value_cents,
        'payment_method', NEW.payment_method,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_payments
  AFTER UPDATE ON public.payment_charges
  FOR EACH ROW EXECUTE FUNCTION public.audit_payment_changes();

-- Trigger subscriptions
CREATE OR REPLACE FUNCTION public.audit_subscription_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit(
      NEW.owner_id, NEW.owner_type, NULL,
      'subscription.created', 'subscription', NEW.id,
      'Assinatura criada com status: ' || NEW.status,
      jsonb_build_object('plan_id', NEW.plan_id, 'status', NEW.status)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.log_audit(
      NEW.owner_id, NEW.owner_type, NULL,
      'subscription.' || NEW.status, 'subscription', NEW.id,
      'Assinatura: ' || OLD.status || ' → ' || NEW.status,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'mp_preapproval_id', NEW.mp_preapproval_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_subscriptions
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.audit_subscription_changes();
