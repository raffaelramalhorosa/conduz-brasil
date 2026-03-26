-- Migration 1: Tabelas do sistema de assinaturas

-- Planos disponíveis
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('instructor', 'school')),
  price_cents INTEGER NOT NULL,
  max_instructors INTEGER,
  billing_interval TEXT NOT NULL DEFAULT 'monthly',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assinatura ativa por usuário
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('instructor', 'school')),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trial'
    CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'suspended')),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  mp_preapproval_id TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id, owner_type)
);

-- Histórico de cobranças
CREATE TABLE public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id),
  owner_id UUID NOT NULL,
  owner_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('paid', 'failed', 'pending')),
  mp_payment_id TEXT,
  payment_date TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_sub_owner ON public.subscriptions(owner_id, owner_type);
CREATE INDEX idx_sub_status ON public.subscriptions(status);
CREATE INDEX idx_subpay_subscription ON public.subscription_payments(subscription_id);

-- Trigger updated_at em subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
