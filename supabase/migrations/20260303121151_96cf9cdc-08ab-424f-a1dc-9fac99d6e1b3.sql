
-- =============================================
-- SQL 1/7: Tabela payment_charges
-- =============================================

CREATE TABLE public.payment_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  correlation_id TEXT UNIQUE NOT NULL,
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  mp_merchant_order_id TEXT,
  value_cents INTEGER NOT NULL CHECK (value_cents > 0),
  payment_method TEXT,
  payment_method_detail TEXT,
  installments INTEGER DEFAULT 1,
  checkout_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'awaiting_payment', 'approved', 'in_process',
    'rejected', 'expired', 'refunded', 'cancelled'
  )),
  payer_email TEXT,
  payer_name TEXT,
  payer_tax_id TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_charges_booking ON public.payment_charges(booking_id);
CREATE INDEX idx_payment_charges_student ON public.payment_charges(student_id);
CREATE INDEX idx_payment_charges_correlation ON public.payment_charges(correlation_id);
CREATE INDEX idx_payment_charges_status ON public.payment_charges(status);
CREATE INDEX idx_payment_charges_mp_payment ON public.payment_charges(mp_payment_id);

ALTER TABLE public.payment_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aluno vê próprias cobranças"
  ON public.payment_charges FOR SELECT
  USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Instrutor vê cobranças dos seus bookings"
  ON public.payment_charges FOR SELECT
  USING (booking_id IN (
    SELECT id FROM public.bookings WHERE instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  ));

CREATE TRIGGER update_payment_charges_updated_at
  BEFORE UPDATE ON public.payment_charges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.payment_charges IS 'Cobranças geradas via Mercado Pago para pagamento de aulas';

-- =============================================
-- SQL 2/7: Tabela pix_keys
-- =============================================

CREATE TABLE public.pix_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  driving_school_id UUID REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL CHECK (pix_key_type IN ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM')),
  label TEXT,
  is_default BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT pix_key_owner_check CHECK (
    (instructor_id IS NOT NULL AND driving_school_id IS NULL)
    OR (instructor_id IS NULL AND driving_school_id IS NOT NULL)
  )
);

CREATE INDEX idx_pix_keys_instructor ON public.pix_keys(instructor_id);
CREATE INDEX idx_pix_keys_school ON public.pix_keys(driving_school_id);
CREATE UNIQUE INDEX idx_pix_keys_default_instructor
  ON public.pix_keys(instructor_id) WHERE is_default = TRUE AND instructor_id IS NOT NULL;
CREATE UNIQUE INDEX idx_pix_keys_default_school
  ON public.pix_keys(driving_school_id) WHERE is_default = TRUE AND driving_school_id IS NOT NULL;

ALTER TABLE public.pix_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instrutor gerencia próprias chaves pix"
  ON public.pix_keys FOR ALL
  USING (instructor_id IN (SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()))
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Autoescola gerencia próprias chaves pix"
  ON public.pix_keys FOR ALL
  USING (driving_school_id IN (
    SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid() AND is_driving_school = true
  ))
  WITH CHECK (driving_school_id IN (
    SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid() AND is_driving_school = true
  ));

CREATE TRIGGER update_pix_keys_updated_at
  BEFORE UPDATE ON public.pix_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.pix_keys IS 'Chaves Pix de instrutores e autoescolas para receber saques via Pix Out';

-- =============================================
-- SQL 3/7: Tabela mp_connected_accounts
-- =============================================

CREATE TABLE public.mp_connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  driving_school_id UUID REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  mp_user_id TEXT NOT NULL,
  mp_access_token TEXT NOT NULL,
  mp_refresh_token TEXT,
  mp_public_key TEXT,
  mp_email TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_refreshed_at TIMESTAMP WITH TIME ZONE,
  disconnected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT mp_account_owner_check CHECK (
    (instructor_id IS NOT NULL AND driving_school_id IS NULL)
    OR (instructor_id IS NULL AND driving_school_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX idx_mp_accounts_instructor
  ON public.mp_connected_accounts(instructor_id) WHERE is_active = TRUE AND instructor_id IS NOT NULL;
CREATE UNIQUE INDEX idx_mp_accounts_school
  ON public.mp_connected_accounts(driving_school_id) WHERE is_active = TRUE AND driving_school_id IS NOT NULL;

ALTER TABLE public.mp_connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instrutor gerencia própria conta MP"
  ON public.mp_connected_accounts FOR ALL
  USING (instructor_id IN (SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()))
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Autoescola gerencia própria conta MP"
  ON public.mp_connected_accounts FOR ALL
  USING (driving_school_id IN (
    SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid() AND is_driving_school = true
  ))
  WITH CHECK (driving_school_id IN (
    SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid() AND is_driving_school = true
  ));

CREATE TRIGGER update_mp_accounts_updated_at
  BEFORE UPDATE ON public.mp_connected_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.mp_connected_accounts IS 'Contas Mercado Pago conectadas via OAuth (opcional, para saque via MP)';

-- =============================================
-- SQL 4/7: Alterar bookings
-- =============================================

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid'
  CHECK (payment_status IN ('unpaid', 'awaiting_payment', 'paid', 'refunded', 'refund_pending'));

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS active_charge_id UUID REFERENCES public.payment_charges(id);

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);

-- =============================================
-- SQL 5/7: Alterar transactions e withdrawals
-- =============================================

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS charge_id UUID REFERENCES public.payment_charges(id);

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS gateway_fee DECIMAL(10,2) DEFAULT 0;

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS driving_school_id UUID REFERENCES public.instructor_profiles(id);

ALTER TABLE public.transactions ALTER COLUMN instructor_id DROP NOT NULL;

-- Remove unique constraint on booking_id to allow multiple transactions per booking
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_booking_id_key;
CREATE INDEX IF NOT EXISTS idx_transactions_booking ON public.transactions(booking_id);

-- Update transaction_type constraint
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_transaction_type_check
  CHECK (transaction_type IN ('class_payment', 'school_commission', 'refund', 'bonus', 'penalty'));

CREATE INDEX IF NOT EXISTS idx_transactions_school ON public.transactions(driving_school_id);

CREATE POLICY "Autoescola vê próprias transações"
  ON public.transactions FOR SELECT
  USING (driving_school_id IN (
    SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid() AND is_driving_school = true
  ));

-- === WITHDRAWALS ===

ALTER TABLE public.withdrawals
ADD COLUMN IF NOT EXISTS driving_school_id UUID REFERENCES public.instructor_profiles(id);

ALTER TABLE public.withdrawals ALTER COLUMN instructor_id DROP NOT NULL;

ALTER TABLE public.withdrawals
ADD COLUMN IF NOT EXISTS withdrawal_method TEXT DEFAULT 'pix'
  CHECK (withdrawal_method IN ('pix', 'mercado_pago'));

ALTER TABLE public.withdrawals
ADD COLUMN IF NOT EXISTS pix_key TEXT;

ALTER TABLE public.withdrawals
ADD COLUMN IF NOT EXISTS pix_key_type TEXT CHECK (
  pix_key_type IS NULL OR pix_key_type IN ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM')
);

ALTER TABLE public.withdrawals
ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;

ALTER TABLE public.withdrawals
ADD COLUMN IF NOT EXISTS mp_correlation_id TEXT;

ALTER TABLE public.withdrawals ALTER COLUMN bank_name DROP NOT NULL;
ALTER TABLE public.withdrawals ALTER COLUMN account_type DROP NOT NULL;
ALTER TABLE public.withdrawals ALTER COLUMN account_number DROP NOT NULL;
ALTER TABLE public.withdrawals ALTER COLUMN account_holder DROP NOT NULL;
ALTER TABLE public.withdrawals ALTER COLUMN cpf_cnpj DROP NOT NULL;

ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawal_owner_check CHECK (
  (instructor_id IS NOT NULL AND driving_school_id IS NULL)
  OR (instructor_id IS NULL AND driving_school_id IS NOT NULL)
);

CREATE POLICY "Autoescola vê próprios saques"
  ON public.withdrawals FOR SELECT
  USING (driving_school_id IN (
    SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid() AND is_driving_school = true
  ));

CREATE POLICY "Autoescola pode criar saques"
  ON public.withdrawals FOR INSERT
  WITH CHECK (driving_school_id IN (
    SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid() AND is_driving_school = true
  ));

-- =============================================
-- SQL 6/7: Trigger de transação ao completar aula
-- =============================================

CREATE OR REPLACE FUNCTION public.create_transaction_after_class()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN

    -- 1) Transação do INSTRUTOR
    IF NOT EXISTS (
      SELECT 1 FROM public.transactions WHERE booking_id = NEW.id AND transaction_type = 'class_payment'
    ) THEN
      INSERT INTO public.transactions (
        booking_id, instructor_id, student_id, gross_amount, platform_fee, gateway_fee,
        net_amount, transaction_type, status, available_date, description
      ) VALUES (
        NEW.id, NEW.instructor_id, NEW.student_id, NEW.total_price, NEW.platform_fee, 0,
        NEW.instructor_amount, 'class_payment', 'pending', NOW() + INTERVAL '30 days',
        'Pagamento de aula - ' || TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY')
      );
    END IF;

    -- 2) Transação da AUTOESCOLA (comissão)
    IF NEW.is_affiliated_booking = TRUE
       AND NEW.driving_school_id IS NOT NULL
       AND COALESCE(NEW.school_fee, 0) > 0
    THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.transactions WHERE booking_id = NEW.id AND transaction_type = 'school_commission'
      ) THEN
        INSERT INTO public.transactions (
          booking_id, driving_school_id, student_id, gross_amount, platform_fee, gateway_fee,
          net_amount, transaction_type, status, available_date, description
        ) VALUES (
          NEW.id, NEW.driving_school_id, NEW.student_id, NEW.school_fee, 0, 0,
          NEW.school_fee, 'school_commission', 'pending', NOW() + INTERVAL '30 days',
          'Comissão de aula filiada - ' || TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY')
        );
      END IF;
    END IF;

    -- 3) Notificar instrutor
    INSERT INTO public.notifications (user_id, type, title, message, action_url)
    SELECT ip.user_id, 'payment_received', 'Pagamento Registrado',
      'R$ ' || NEW.instructor_amount || ' registrado. Disponível para saque em 30 dias.',
      '/admin/financeiro'
    FROM public.instructor_profiles ip WHERE ip.id = NEW.instructor_id;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger (drop if exists to avoid duplicates)
DROP TRIGGER IF EXISTS trigger_create_transaction_after_class ON public.bookings;
CREATE TRIGGER trigger_create_transaction_after_class
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.create_transaction_after_class();

-- =============================================
-- SQL 7/7: Funções utilitárias
-- =============================================

CREATE OR REPLACE FUNCTION public.release_available_funds()
RETURNS INTEGER AS $$
DECLARE updated_count INTEGER;
BEGIN
  UPDATE public.transactions SET status = 'available'
  WHERE status = 'pending' AND available_date <= NOW();
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_instructor_balance(p_instructor_id UUID)
RETURNS TABLE (
  total_pending DECIMAL(10,2), total_available DECIMAL(10,2),
  total_withdrawn DECIMAL(10,2), next_release_date TIMESTAMP WITH TIME ZONE,
  next_release_amount DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(t.net_amount) FILTER (WHERE t.status = 'pending'), 0)::DECIMAL(10,2),
    COALESCE(SUM(t.net_amount) FILTER (WHERE t.status = 'available'), 0)::DECIMAL(10,2),
    COALESCE(SUM(t.net_amount) FILTER (WHERE t.status = 'withdrawn'), 0)::DECIMAL(10,2),
    MIN(t.available_date) FILTER (WHERE t.status = 'pending'),
    (SELECT COALESCE(SUM(t2.net_amount), 0) FROM public.transactions t2
     WHERE t2.instructor_id = p_instructor_id AND t2.status = 'pending'
       AND t2.available_date = (SELECT MIN(t3.available_date) FROM public.transactions t3
         WHERE t3.instructor_id = p_instructor_id AND t3.status = 'pending'))::DECIMAL(10,2)
  FROM public.transactions t
  WHERE t.instructor_id = p_instructor_id AND t.transaction_type = 'class_payment';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_school_balance(p_school_id UUID)
RETURNS TABLE (
  total_pending DECIMAL(10,2), total_available DECIMAL(10,2),
  total_withdrawn DECIMAL(10,2), next_release_date TIMESTAMP WITH TIME ZONE,
  next_release_amount DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(t.net_amount) FILTER (WHERE t.status = 'pending'), 0)::DECIMAL(10,2),
    COALESCE(SUM(t.net_amount) FILTER (WHERE t.status = 'available'), 0)::DECIMAL(10,2),
    COALESCE(SUM(t.net_amount) FILTER (WHERE t.status = 'withdrawn'), 0)::DECIMAL(10,2),
    MIN(t.available_date) FILTER (WHERE t.status = 'pending'),
    (SELECT COALESCE(SUM(t2.net_amount), 0) FROM public.transactions t2
     WHERE t2.driving_school_id = p_school_id AND t2.status = 'pending'
       AND t2.available_date = (SELECT MIN(t3.available_date) FROM public.transactions t3
         WHERE t3.driving_school_id = p_school_id AND t3.status = 'pending'))::DECIMAL(10,2)
  FROM public.transactions t
  WHERE t.driving_school_id = p_school_id AND t.transaction_type = 'school_commission';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_withdrawal(
  p_owner_id UUID, p_owner_type TEXT, p_amount DECIMAL(10,2)
)
RETURNS TABLE (
  can_withdraw BOOLEAN, available_balance DECIMAL(10,2),
  has_withdrawal_method BOOLEAN, reason TEXT
) AS $$
DECLARE
  v_available DECIMAL(10,2);
  v_has_pix BOOLEAN;
  v_has_mp BOOLEAN;
  v_min_amount CONSTANT DECIMAL(10,2) := 100.00;
BEGIN
  IF p_owner_type = 'instructor' THEN
    SELECT COALESCE(SUM(net_amount), 0) INTO v_available
    FROM public.transactions WHERE instructor_id = p_owner_id AND status = 'available' AND transaction_type = 'class_payment';
    SELECT EXISTS(SELECT 1 FROM public.pix_keys WHERE instructor_id = p_owner_id) INTO v_has_pix;
    SELECT EXISTS(SELECT 1 FROM public.mp_connected_accounts WHERE instructor_id = p_owner_id AND is_active = TRUE) INTO v_has_mp;
  ELSE
    SELECT COALESCE(SUM(net_amount), 0) INTO v_available
    FROM public.transactions WHERE driving_school_id = p_owner_id AND status = 'available' AND transaction_type = 'school_commission';
    SELECT EXISTS(SELECT 1 FROM public.pix_keys WHERE driving_school_id = p_owner_id) INTO v_has_pix;
    SELECT EXISTS(SELECT 1 FROM public.mp_connected_accounts WHERE driving_school_id = p_owner_id AND is_active = TRUE) INTO v_has_mp;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.withdrawals
    WHERE ((p_owner_type = 'instructor' AND instructor_id = p_owner_id)
      OR (p_owner_type = 'driving_school' AND driving_school_id = p_owner_id))
    AND status IN ('pending', 'processing')
  ) THEN
    RETURN QUERY SELECT false, v_available, (v_has_pix OR v_has_mp), 'Você já tem um saque em processamento'::TEXT;
    RETURN;
  END IF;

  IF NOT v_has_pix AND NOT v_has_mp THEN
    RETURN QUERY SELECT false, v_available, false, 'Cadastre uma chave Pix ou conecte o Mercado Pago para sacar'::TEXT;
    RETURN;
  END IF;

  IF p_amount < v_min_amount THEN
    RETURN QUERY SELECT false, v_available, true, ('Valor mínimo para saque é R$ ' || v_min_amount)::TEXT;
    RETURN;
  END IF;

  IF p_amount > v_available THEN
    RETURN QUERY SELECT false, v_available, true, 'Saldo disponível insuficiente'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_available, true, 'OK'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_withdrawal_methods(
  p_owner_id UUID, p_owner_type TEXT
)
RETURNS TABLE (
  has_pix BOOLEAN, pix_key TEXT, pix_key_type TEXT, has_mp BOOLEAN, mp_email TEXT
) AS $$
BEGIN
  IF p_owner_type = 'instructor' THEN
    RETURN QUERY SELECT
      EXISTS(SELECT 1 FROM public.pix_keys pk WHERE pk.instructor_id = p_owner_id AND pk.is_default = TRUE),
      (SELECT pk.pix_key FROM public.pix_keys pk WHERE pk.instructor_id = p_owner_id AND pk.is_default = TRUE LIMIT 1),
      (SELECT pk.pix_key_type FROM public.pix_keys pk WHERE pk.instructor_id = p_owner_id AND pk.is_default = TRUE LIMIT 1),
      EXISTS(SELECT 1 FROM public.mp_connected_accounts mca WHERE mca.instructor_id = p_owner_id AND mca.is_active = TRUE),
      (SELECT mca.mp_email FROM public.mp_connected_accounts mca WHERE mca.instructor_id = p_owner_id AND mca.is_active = TRUE LIMIT 1);
  ELSE
    RETURN QUERY SELECT
      EXISTS(SELECT 1 FROM public.pix_keys pk WHERE pk.driving_school_id = p_owner_id AND pk.is_default = TRUE),
      (SELECT pk.pix_key FROM public.pix_keys pk WHERE pk.driving_school_id = p_owner_id AND pk.is_default = TRUE LIMIT 1),
      (SELECT pk.pix_key_type FROM public.pix_keys pk WHERE pk.driving_school_id = p_owner_id AND pk.is_default = TRUE LIMIT 1),
      EXISTS(SELECT 1 FROM public.mp_connected_accounts mca WHERE mca.driving_school_id = p_owner_id AND mca.is_active = TRUE),
      (SELECT mca.mp_email FROM public.mp_connected_accounts mca WHERE mca.driving_school_id = p_owner_id AND mca.is_active = TRUE LIMIT 1);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
