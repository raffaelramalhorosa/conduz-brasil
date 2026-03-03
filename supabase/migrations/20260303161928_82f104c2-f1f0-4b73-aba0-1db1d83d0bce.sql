
-- Fix search_path on functions that were missing it
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
