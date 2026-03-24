-- Admins podem ver todos os agendamentos (necessário para dashboard financeiro)
CREATE POLICY "Admins can view all bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins podem ver todos os veículos (necessário para dashboard financeiro)
CREATE POLICY "Admins can view all vehicles"
  ON public.vehicles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
