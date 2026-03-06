CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  student_id uuid NOT NULL REFERENCES public.student_profiles(id),
  amount numeric NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  mp_refund_id text,
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Student can view own refunds
CREATE POLICY "Aluno vê próprios reembolsos"
ON public.refunds
FOR SELECT
TO authenticated
USING (student_id IN (
  SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
));

-- Student can create refund requests
CREATE POLICY "Aluno pode solicitar reembolso"
ON public.refunds
FOR INSERT
TO authenticated
WITH CHECK (student_id IN (
  SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
));

-- Admin can view all refunds
CREATE POLICY "Admin vê todos os reembolsos"
ON public.refunds
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update refunds
CREATE POLICY "Admin pode atualizar reembolsos"
ON public.refunds
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));