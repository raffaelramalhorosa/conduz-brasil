-- Migration 2: Seed dos planos de assinatura

INSERT INTO public.subscription_plans (name, owner_type, price_cents, max_instructors, billing_interval) VALUES
  ('Plano Instrutor',   'instructor', 2200,  NULL, 'monthly'),
  ('Plano Autoescola',  'school',    19900,  15,   'monthly');
