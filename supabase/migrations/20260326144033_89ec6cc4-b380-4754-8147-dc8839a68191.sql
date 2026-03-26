-- RLS nas tabelas de assinatura

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_public_read"
  ON public.subscription_plans
  FOR SELECT
  USING (true);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_own_read"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "sub_no_client_write"
  ON public.subscriptions
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subpay_own_read"
  ON public.subscription_payments
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "subpay_no_client_write"
  ON public.subscription_payments
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);