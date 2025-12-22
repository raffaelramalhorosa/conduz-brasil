-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is part of a booking
CREATE OR REPLACE FUNCTION public.user_is_part_of_booking(p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM bookings b
    INNER JOIN instructor_profiles ip ON ip.id = b.instructor_id
    INNER JOIN student_profiles sp ON sp.id = b.student_id
    WHERE b.id = p_booking_id
      AND (ip.user_id = auth.uid() OR sp.user_id = auth.uid())
  )
$$;

-- Policy: Users can view messages from their bookings
CREATE POLICY "Users can view messages from their bookings"
ON public.chat_messages
FOR SELECT
USING (public.user_is_part_of_booking(booking_id));

-- Policy: Users can send messages to their bookings
CREATE POLICY "Users can send messages to their bookings"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  public.user_is_part_of_booking(booking_id) 
  AND sender_id = auth.uid()
);

-- Policy: Users can update messages they received (mark as read)
CREATE POLICY "Users can mark messages as read"
ON public.chat_messages
FOR UPDATE
USING (
  public.user_is_part_of_booking(booking_id) 
  AND sender_id != auth.uid()
);

-- Create index for faster queries
CREATE INDEX idx_chat_messages_booking_id ON public.chat_messages(booking_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;