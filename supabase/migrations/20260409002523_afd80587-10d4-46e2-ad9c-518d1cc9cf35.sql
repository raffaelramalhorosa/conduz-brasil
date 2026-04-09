CREATE POLICY "dispute_admin_read" ON public.booking_disputes
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
  );