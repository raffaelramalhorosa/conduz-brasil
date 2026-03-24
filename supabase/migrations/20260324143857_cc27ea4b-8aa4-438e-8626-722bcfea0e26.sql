
-- Criar função SECURITY DEFINER para verificar se autoescola tem booking com student_profile
-- Isso evita recursão infinita entre student_profiles RLS e bookings RLS
CREATE OR REPLACE FUNCTION public.school_has_booking_with_student(p_student_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM bookings b
    INNER JOIN instructor_profiles ip ON ip.id = b.driving_school_id
    WHERE ip.user_id = auth.uid()
      AND b.student_id = p_student_profile_id
  )
$$;

-- Remover política problemática que causa recursão
DROP POLICY IF EXISTS "Autoescolas podem ver student_profiles dos seus instrutores" ON public.student_profiles;

-- Recriar política usando função SECURITY DEFINER (sem recursão)
CREATE POLICY "Autoescolas podem ver student_profiles dos seus instrutores"
  ON public.student_profiles
  FOR SELECT
  TO authenticated
  USING (public.school_has_booking_with_student(id));
