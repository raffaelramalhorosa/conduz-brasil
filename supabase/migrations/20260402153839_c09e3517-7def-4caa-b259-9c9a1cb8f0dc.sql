
CREATE OR REPLACE FUNCTION public.check_subscription_access(p_owner_id uuid, p_owner_type text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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

  -- Lifetime: always has access
  IF v_sub.status = 'lifetime' THEN
    RETURN jsonb_build_object(
      'has_access', true,
      'status',     'lifetime'
    );
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
