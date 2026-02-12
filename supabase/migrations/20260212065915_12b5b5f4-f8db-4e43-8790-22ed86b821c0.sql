
-- 1. ALTERAÇÕES NA TABELA driving_school_instructors
ALTER TABLE driving_school_instructors
  ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS invitation_status text DEFAULT 'none' CHECK (invitation_status IN ('none','pending_invitation','accepted','rejected')),
  ADD COLUMN IF NOT EXISTS invitation_token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS invitation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS invitation_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_account_linked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fixed_fee numeric DEFAULT 0;

-- 2. ALTERAÇÕES NA TABELA bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS driving_school_id uuid REFERENCES instructor_profiles(id),
  ADD COLUMN IF NOT EXISTS driving_school_instructor_id uuid REFERENCES driving_school_instructors(id),
  ADD COLUMN IF NOT EXISTS is_affiliated_booking boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS school_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS school_fee_type text DEFAULT 'percentage' CHECK (school_fee_type IN ('percentage','fixed')),
  ADD COLUMN IF NOT EXISTS school_fee_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accepted_by_school_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_by uuid;

-- 3. NOVA TABELA school_commission_settings
CREATE TABLE IF NOT EXISTS public.school_commission_settings (
  id                   uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driving_school_id    uuid        NOT NULL REFERENCES instructor_profiles(id) ON DELETE CASCADE,
  default_commission_rate numeric  NOT NULL DEFAULT 30,
  default_fixed_fee    numeric    DEFAULT 0,
  commission_type      text       NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage','fixed','mixed')),
  min_commission       numeric    DEFAULT 0,
  max_commission       numeric    DEFAULT 100,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  UNIQUE(driving_school_id)
);
ALTER TABLE school_commission_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autoescola vê próprias configurações de comissão"
  ON school_commission_settings FOR SELECT
  USING (driving_school_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Autoescola pode criar configurações de comissão"
  ON school_commission_settings FOR INSERT
  WITH CHECK (driving_school_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Autoescola pode atualizar configurações de comissão"
  ON school_commission_settings FOR UPDATE
  USING (driving_school_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid()));

-- 4. NOVA TABELA affiliation_invitations
CREATE TABLE IF NOT EXISTS public.affiliation_invitations (
  id                uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driving_school_id uuid        NOT NULL REFERENCES instructor_profiles(id) ON DELETE CASCADE,
  email             text        NOT NULL,
  instructor_name   text        NOT NULL,
  token             uuid        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status            text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired')),
  email_exists      boolean     DEFAULT false,
  sent_at           timestamptz DEFAULT now(),
  accepted_at       timestamptz,
  rejected_at       timestamptz,
  expires_at        timestamptz DEFAULT (now() + interval '7 days'),
  created_at        timestamptz DEFAULT now()
);
ALTER TABLE affiliation_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autoescola vê próprios convites"
  ON affiliation_invitations FOR SELECT
  USING (driving_school_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Autoescola pode criar convites"
  ON affiliation_invitations FOR INSERT
  WITH CHECK (driving_school_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Autoescola pode atualizar convites"
  ON affiliation_invitations FOR UPDATE
  USING (driving_school_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Instrutor pode ver convites direcionados ao seu email"
  ON affiliation_invitations FOR SELECT
  USING (email IN (SELECT email FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Instrutor pode atualizar convites direcionados ao seu email"
  ON affiliation_invitations FOR UPDATE
  USING (email IN (SELECT email FROM profiles WHERE id = auth.uid()));

-- 5. RPC: VERIFICAR SE EMAIL EXISTE
CREATE OR REPLACE FUNCTION check_email_exists(check_email text)
RETURNS TABLE (
  exists_in_system boolean,
  user_type text,
  user_id uuid,
  full_name text,
  is_already_affiliated boolean,
  affiliated_school_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    true AS exists_in_system,
    p.user_type::text,
    p.id AS user_id,
    p.full_name,
    EXISTS(
      SELECT 1 FROM driving_school_instructors dsi
      INNER JOIN instructor_profiles ip ON ip.id = dsi.driving_school_id
      WHERE dsi.linked_user_id = p.id AND dsi.status = 'active'
    ) AS is_already_affiliated,
    (
      SELECT ip.business_name FROM driving_school_instructors dsi
      INNER JOIN instructor_profiles ip ON ip.id = dsi.driving_school_id
      WHERE dsi.linked_user_id = p.id AND dsi.status = 'active'
      LIMIT 1
    ) AS affiliated_school_name
  FROM profiles p
  WHERE LOWER(p.email) = LOWER(check_email)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_email_exists TO authenticated;

-- 6. RPC: ACEITAR CONVITE DE FILIAÇÃO
CREATE OR REPLACE FUNCTION accept_affiliation_invitation(p_token uuid)
RETURNS jsonb AS $$
DECLARE
  v_invitation affiliation_invitations%ROWTYPE;
  v_user_id uuid;
  v_instructor_profile_id uuid;
BEGIN
  -- Buscar convite
  SELECT * INTO v_invitation FROM affiliation_invitations WHERE token = p_token AND status = 'pending';

  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite não encontrado ou já utilizado');
  END IF;

  IF v_invitation.expires_at < now() THEN
    UPDATE affiliation_invitations SET status = 'expired' WHERE id = v_invitation.id;
    RETURN jsonb_build_object('success', false, 'error', 'Convite expirado');
  END IF;

  v_user_id := auth.uid();

  -- Buscar instructor_profile do usuário logado
  SELECT id INTO v_instructor_profile_id FROM instructor_profiles WHERE user_id = v_user_id;

  -- Atualizar convite
  UPDATE affiliation_invitations SET status = 'accepted', accepted_at = now() WHERE id = v_invitation.id;

  -- Atualizar driving_school_instructors
  UPDATE driving_school_instructors
  SET linked_user_id = v_user_id,
      invitation_status = 'accepted',
      invitation_accepted_at = now(),
      is_account_linked = true,
      status = 'active'
  WHERE driving_school_id = v_invitation.driving_school_id
    AND email = v_invitation.email;

  RETURN jsonb_build_object('success', true, 'message', 'Filiação aceita com sucesso');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION accept_affiliation_invitation TO authenticated;

-- 7. RPC: BUSCAR AULAS DO INSTRUTOR FILIADO (para a autoescola ver)
CREATE OR REPLACE FUNCTION get_school_bookings(
  p_school_instructor_profile_id uuid,
  p_date_from date DEFAULT CURRENT_DATE - interval '30 days',
  p_date_to date DEFAULT CURRENT_DATE + interval '30 days'
)
RETURNS TABLE (
  booking_id uuid,
  student_name text,
  instructor_name text,
  driving_school_instructor_id uuid,
  scheduled_date date,
  start_time time,
  end_time time,
  duration_hours numeric,
  total_price numeric,
  school_fee numeric,
  instructor_amount numeric,
  status text,
  pickup_address text,
  license_category text,
  vehicle_brand text,
  vehicle_model text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id AS booking_id,
    p_student.full_name AS student_name,
    COALESCE(dsi.name, p_instructor.full_name) AS instructor_name,
    b.driving_school_instructor_id,
    b.scheduled_date,
    b.start_time,
    b.end_time,
    b.duration_hours,
    b.total_price,
    b.school_fee,
    b.instructor_amount,
    b.status,
    b.pickup_address,
    b.license_category,
    v.brand AS vehicle_brand,
    v.model AS vehicle_model
  FROM bookings b
  INNER JOIN student_profiles sp ON sp.id = b.student_id
  INNER JOIN profiles p_student ON p_student.id = sp.user_id
  INNER JOIN instructor_profiles ip ON ip.id = b.instructor_id
  INNER JOIN profiles p_instructor ON p_instructor.id = ip.user_id
  LEFT JOIN driving_school_instructors dsi ON dsi.id = b.driving_school_instructor_id
  LEFT JOIN vehicles v ON v.id = b.vehicle_id
  WHERE b.driving_school_id = p_school_instructor_profile_id
    AND b.scheduled_date BETWEEN p_date_from AND p_date_to
  ORDER BY b.scheduled_date ASC, b.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_school_bookings TO authenticated;

-- 8. RPC: DASHBOARD FINANCEIRO DA AUTOESCOLA
CREATE OR REPLACE FUNCTION get_school_financial_summary(
  p_school_instructor_profile_id uuid,
  p_date_from date DEFAULT date_trunc('month', CURRENT_DATE)::date,
  p_date_to date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  instructor_dsi_id uuid,
  instructor_name text,
  total_bookings bigint,
  completed_bookings bigint,
  total_revenue numeric,
  total_school_fees numeric,
  total_instructor_pay numeric,
  avg_class_price numeric,
  commission_rate numeric,
  fixed_fee numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dsi.id AS instructor_dsi_id,
    dsi.name AS instructor_name,
    COUNT(b.id) AS total_bookings,
    COUNT(b.id) FILTER (WHERE b.status = 'completed') AS completed_bookings,
    COALESCE(SUM(b.total_price) FILTER (WHERE b.status = 'completed'), 0) AS total_revenue,
    COALESCE(SUM(b.school_fee) FILTER (WHERE b.status = 'completed'), 0) AS total_school_fees,
    COALESCE(SUM(b.instructor_amount) FILTER (WHERE b.status = 'completed'), 0) AS total_instructor_pay,
    COALESCE(AVG(b.total_price) FILTER (WHERE b.status = 'completed'), 0) AS avg_class_price,
    dsi.commission_rate,
    dsi.fixed_fee
  FROM driving_school_instructors dsi
  LEFT JOIN bookings b ON b.driving_school_instructor_id = dsi.id
    AND b.scheduled_date BETWEEN p_date_from AND p_date_to
  WHERE dsi.driving_school_id = p_school_instructor_profile_id
    AND dsi.status = 'active'
  GROUP BY dsi.id, dsi.name, dsi.commission_rate, dsi.fixed_fee
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_school_financial_summary TO authenticated;

-- 9. NOVA RLS: AUTOESCOLA VÊ BOOKINGS DOS SEUS INSTRUTORES FILIADOS
CREATE POLICY "Autoescola pode ver bookings dos seus instrutores filiados"
  ON bookings FOR SELECT
  USING (driving_school_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Autoescola pode atualizar bookings dos seus instrutores filiados"
  ON bookings FOR UPDATE
  USING (driving_school_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid()));
