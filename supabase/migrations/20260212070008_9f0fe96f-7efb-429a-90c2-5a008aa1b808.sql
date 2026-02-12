
-- Fix search_path for all new functions
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
      SELECT 1 FROM public.driving_school_instructors dsi
      INNER JOIN public.instructor_profiles ip ON ip.id = dsi.driving_school_id
      WHERE dsi.linked_user_id = p.id AND dsi.status = 'active'
    ) AS is_already_affiliated,
    (
      SELECT ip.business_name FROM public.driving_school_instructors dsi
      INNER JOIN public.instructor_profiles ip ON ip.id = dsi.driving_school_id
      WHERE dsi.linked_user_id = p.id AND dsi.status = 'active'
      LIMIT 1
    ) AS affiliated_school_name
  FROM public.profiles p
  WHERE LOWER(p.email) = LOWER(check_email)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION check_email_exists TO authenticated;

CREATE OR REPLACE FUNCTION accept_affiliation_invitation(p_token uuid)
RETURNS jsonb AS $$
DECLARE
  v_invitation public.affiliation_invitations%ROWTYPE;
  v_user_id uuid;
  v_instructor_profile_id uuid;
BEGIN
  SELECT * INTO v_invitation FROM public.affiliation_invitations WHERE token = p_token AND status = 'pending';
  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite não encontrado ou já utilizado');
  END IF;
  IF v_invitation.expires_at < now() THEN
    UPDATE public.affiliation_invitations SET status = 'expired' WHERE id = v_invitation.id;
    RETURN jsonb_build_object('success', false, 'error', 'Convite expirado');
  END IF;
  v_user_id := auth.uid();
  SELECT id INTO v_instructor_profile_id FROM public.instructor_profiles WHERE user_id = v_user_id;
  UPDATE public.affiliation_invitations SET status = 'accepted', accepted_at = now() WHERE id = v_invitation.id;
  UPDATE public.driving_school_instructors
  SET linked_user_id = v_user_id, invitation_status = 'accepted', invitation_accepted_at = now(), is_account_linked = true, status = 'active'
  WHERE driving_school_id = v_invitation.driving_school_id AND email = v_invitation.email;
  RETURN jsonb_build_object('success', true, 'message', 'Filiação aceita com sucesso');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION accept_affiliation_invitation TO authenticated;

CREATE OR REPLACE FUNCTION get_school_bookings(
  p_school_instructor_profile_id uuid,
  p_date_from date DEFAULT CURRENT_DATE - interval '30 days',
  p_date_to date DEFAULT CURRENT_DATE + interval '30 days'
)
RETURNS TABLE (
  booking_id uuid, student_name text, instructor_name text, driving_school_instructor_id uuid,
  scheduled_date date, start_time time, end_time time, duration_hours numeric,
  total_price numeric, school_fee numeric, instructor_amount numeric, status text,
  pickup_address text, license_category text, vehicle_brand text, vehicle_model text
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, p_student.full_name, COALESCE(dsi.name, p_instructor.full_name), b.driving_school_instructor_id,
    b.scheduled_date, b.start_time, b.end_time, b.duration_hours, b.total_price, b.school_fee, b.instructor_amount,
    b.status, b.pickup_address, b.license_category, v.brand, v.model
  FROM public.bookings b
  INNER JOIN public.student_profiles sp ON sp.id = b.student_id
  INNER JOIN public.profiles p_student ON p_student.id = sp.user_id
  INNER JOIN public.instructor_profiles ip ON ip.id = b.instructor_id
  INNER JOIN public.profiles p_instructor ON p_instructor.id = ip.user_id
  LEFT JOIN public.driving_school_instructors dsi ON dsi.id = b.driving_school_instructor_id
  LEFT JOIN public.vehicles v ON v.id = b.vehicle_id
  WHERE b.driving_school_id = p_school_instructor_profile_id
    AND b.scheduled_date BETWEEN p_date_from AND p_date_to
  ORDER BY b.scheduled_date ASC, b.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_school_bookings TO authenticated;

CREATE OR REPLACE FUNCTION get_school_financial_summary(
  p_school_instructor_profile_id uuid,
  p_date_from date DEFAULT date_trunc('month', CURRENT_DATE)::date,
  p_date_to date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  instructor_dsi_id uuid, instructor_name text, total_bookings bigint, completed_bookings bigint,
  total_revenue numeric, total_school_fees numeric, total_instructor_pay numeric,
  avg_class_price numeric, commission_rate numeric, fixed_fee numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT dsi.id, dsi.name, COUNT(b.id), COUNT(b.id) FILTER (WHERE b.status = 'completed'),
    COALESCE(SUM(b.total_price) FILTER (WHERE b.status = 'completed'), 0),
    COALESCE(SUM(b.school_fee) FILTER (WHERE b.status = 'completed'), 0),
    COALESCE(SUM(b.instructor_amount) FILTER (WHERE b.status = 'completed'), 0),
    COALESCE(AVG(b.total_price) FILTER (WHERE b.status = 'completed'), 0),
    dsi.commission_rate, dsi.fixed_fee
  FROM public.driving_school_instructors dsi
  LEFT JOIN public.bookings b ON b.driving_school_instructor_id = dsi.id
    AND b.scheduled_date BETWEEN p_date_from AND p_date_to
  WHERE dsi.driving_school_id = p_school_instructor_profile_id AND dsi.status = 'active'
  GROUP BY dsi.id, dsi.name, dsi.commission_rate, dsi.fixed_fee
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_school_financial_summary TO authenticated;
