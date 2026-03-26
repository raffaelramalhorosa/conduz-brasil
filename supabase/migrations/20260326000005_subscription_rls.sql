-- Migration 5: Row Level Security nas tabelas de assinatura

-- ── subscription_plans ──────────────────────────────────────────────────────
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Planos são públicos (necessário para o frontend exibir preços sem autenticação)
CREATE POLICY "plans_public_read"
  ON public.subscription_plans
  FOR SELECT
  USING (true);

-- ── subscriptions ────────────────────────────────────────────────────────────
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Cada usuário enxerga apenas a própria assinatura
CREATE POLICY "sub_own_read"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Escrita bloqueada para clientes autenticados (somente Edge Functions via service_role)
CREATE POLICY "sub_no_client_write"
  ON public.subscriptions
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- ── subscription_payments ────────────────────────────────────────────────────
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Cada usuário enxerga apenas os próprios pagamentos
CREATE POLICY "subpay_own_read"
  ON public.subscription_payments
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Escrita bloqueada para clientes autenticados (somente Edge Functions via service_role)
CREATE POLICY "subpay_no_client_write"
  ON public.subscription_payments
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);
