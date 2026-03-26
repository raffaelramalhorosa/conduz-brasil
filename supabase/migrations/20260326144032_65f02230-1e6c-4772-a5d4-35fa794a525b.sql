CREATE OR REPLACE FUNCTION public.create_profile_trial()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_owner_type TEXT;
  v_plan_id    UUID;
BEGIN
  IF NEW.is_driving_school IS TRUE THEN
    v_owner_type := 'school';
  ELSE
    v_owner_type := 'instructor';
  END IF;

  SELECT id INTO v_plan_id
  FROM public.subscription_plans
  WHERE owner_type = v_owner_type AND is_active = true
  LIMIT 1;

  INSERT INTO public.subscriptions (
    owner_id,
    owner_type,
    plan_id,
    status,
    trial_ends_at
  ) VALUES (
    NEW.user_id,
    v_owner_type,
    v_plan_id,
    'trial',
    now() + interval '7 days'
  )
  ON CONFLICT (owner_id, owner_type) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profile_trial
  AFTER INSERT ON public.instructor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_trial();