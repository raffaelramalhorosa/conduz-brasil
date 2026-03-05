-- RLS policies for mp_connected_accounts
ALTER TABLE public.mp_connected_accounts ENABLE ROW LEVEL SECURITY;

-- Instructor can view their own MP connection
CREATE POLICY "Instrutor vê própria conexão MP"
ON public.mp_connected_accounts
FOR SELECT
TO authenticated
USING (
  instructor_id IN (
    SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
  )
);

-- Driving school can view their own MP connection
CREATE POLICY "Autoescola vê própria conexão MP"
ON public.mp_connected_accounts
FOR SELECT
TO authenticated
USING (
  driving_school_id IN (
    SELECT id FROM instructor_profiles WHERE user_id = auth.uid() AND is_driving_school = true
  )
);

-- Instructor can update their own MP connection (disconnect)
CREATE POLICY "Instrutor atualiza própria conexão MP"
ON public.mp_connected_accounts
FOR UPDATE
TO authenticated
USING (
  instructor_id IN (
    SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
  )
);

-- Driving school can update their own MP connection (disconnect)
CREATE POLICY "Autoescola atualiza própria conexão MP"
ON public.mp_connected_accounts
FOR UPDATE
TO authenticated
USING (
  driving_school_id IN (
    SELECT id FROM instructor_profiles WHERE user_id = auth.uid() AND is_driving_school = true
  )
);