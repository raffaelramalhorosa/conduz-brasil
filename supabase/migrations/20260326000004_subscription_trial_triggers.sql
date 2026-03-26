-- Migration 4: Triggers para criar trial automático ao registrar instrutor/autoescola
--
-- Nota arquitetural: no schema deste projeto não existe tabela driving_schools separada.
-- Tanto instrutores quanto autoescolas são armazenados em instructor_profiles.
-- O campo is_driving_school (boolean) diferencia os dois tipos.
-- Por isso, um único trigger cobre ambos os casos.

CREATE OR REPLACE FUNCTION public.create_profile_trial()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_owner_type TEXT;
  v_plan_id    UUID;
BEGIN
  -- Determinar tipo de dono com base no campo is_driving_school
  IF NEW.is_driving_school IS TRUE THEN
    v_owner_type := 'school';
  ELSE
    v_owner_type := 'instructor';
  END IF;

  -- Buscar o plano ativo correspondente
  SELECT id INTO v_plan_id
  FROM public.subscription_plans
  WHERE owner_type = v_owner_type AND is_active = true
  LIMIT 1;

  -- Criar trial de 7 dias; ON CONFLICT garante idempotência
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
