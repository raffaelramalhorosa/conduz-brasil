-- Migration: Adicionar planos anuais ao sistema de assinaturas

-- 1. Adicionar coluna savings_cents para exibição de economia na UI
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS savings_cents INTEGER DEFAULT 0;

-- 2. Inserir planos anuais
INSERT INTO public.subscription_plans
  (name, owner_type, price_cents, max_instructors, billing_interval)
VALUES
  ('Plano Instrutor Anual', 'instructor', 22000, NULL, 'yearly'),
  ('Plano Autoescola Anual', 'school', 199000, 15, 'yearly');

-- 3. Definir economia dos planos anuais
-- Instrutor: R$22/mês × 12 = R$264 vs R$220/ano → R$44 de economia
UPDATE public.subscription_plans
SET savings_cents = 4400
WHERE billing_interval = 'yearly' AND owner_type = 'instructor';

-- Autoescola: R$199/mês × 12 = R$2.388 vs R$1.990/ano → R$398 de economia
UPDATE public.subscription_plans
SET savings_cents = 39800
WHERE billing_interval = 'yearly' AND owner_type = 'school';

-- 4. Corrigir trigger de trial para sempre usar plano mensal
--    (garante que novos usuários não sejam associados ao plano anual no trial)
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
  WHERE owner_type = v_owner_type
    AND is_active = true
    AND billing_interval = 'monthly'
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
