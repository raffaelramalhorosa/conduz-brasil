
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS instructor_no_show boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS no_show_reported_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS no_show_reported_by uuid;
