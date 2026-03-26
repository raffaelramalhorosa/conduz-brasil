CREATE OR REPLACE FUNCTION public.check_subscription_access(
  p_owner_id UUID,
  p_owner_type TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_sub RECORD;
BEGIN
  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE owner_id = p_owner_id AND owner_type = p_owner_type;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('has_access', false, 'reason', 'no_subscription');
  END IF;

  IF v_sub.status = 'trial' AND v_sub.trial_ends_at > now() THEN
    RETURN jsonb_build_object(
      'has_access',       true,
      'status',           'trial',
      'trial_ends_at',    v_sub.trial_ends_at,
      'days_remaining',   EXTRACT(DAY FROM v_sub.trial_ends_at - now())::int
    );
  END IF;

  IF v_sub.status = 'active' AND v_sub.current_period_end > now() THEN
    RETURN jsonb_build_object(
      'has_access',          true,
      'status',              'active',
      'current_period_end',  v_sub.current_period_end
    );
  END IF;

  RETURN jsonb_build_object(
    'has_access', false,
    'reason',     v_sub.status,
    'status',     v_sub.status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_subscription_access TO authenticated, service_role;