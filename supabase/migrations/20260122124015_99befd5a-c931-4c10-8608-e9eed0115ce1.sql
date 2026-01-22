-- Create conversations table to hold unique student-instructor pairs
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  instructor_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_student_instructor UNIQUE (student_id, instructor_id)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Students can view their own conversations"
ON public.conversations
FOR SELECT
USING (student_id IN (
  SELECT id FROM student_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Instructors can view their own conversations"
ON public.conversations
FOR SELECT
USING (instructor_id IN (
  SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Students can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (student_id IN (
  SELECT id FROM student_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Instructors can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (instructor_id IN (
  SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
));

-- Add conversation_id to chat_messages (keeping booking_id for context)
ALTER TABLE public.chat_messages
ADD COLUMN conversation_id UUID REFERENCES public.conversations(id);

-- Create index for better performance
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX idx_conversations_student_id ON public.conversations(student_id);
CREATE INDEX idx_conversations_instructor_id ON public.conversations(instructor_id);

-- Create a function to get or create a conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_student_id UUID,
  p_instructor_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE student_id = p_student_id AND instructor_id = p_instructor_id;
  
  -- If not found, create new one
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (student_id, instructor_id)
    VALUES (p_student_id, p_instructor_id)
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$;

-- Create function to check if user is part of conversation
CREATE OR REPLACE FUNCTION public.user_is_part_of_conversation(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = p_conversation_id
    AND (
      c.student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
      OR
      c.instructor_id IN (SELECT id FROM instructor_profiles WHERE user_id = auth.uid())
    )
  );
END;
$$;

-- Update RLS policies on chat_messages to also work with conversation_id
CREATE POLICY "Users can view messages from their conversations"
ON public.chat_messages
FOR SELECT
USING (
  user_is_part_of_booking(booking_id)
  OR user_is_part_of_conversation(conversation_id)
);

CREATE POLICY "Users can send messages to their conversations"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  (user_is_part_of_booking(booking_id) AND sender_id = auth.uid())
  OR (user_is_part_of_conversation(conversation_id) AND sender_id = auth.uid())
);

CREATE POLICY "Users can mark conversation messages as read"
ON public.chat_messages
FOR UPDATE
USING (
  (user_is_part_of_booking(booking_id) AND sender_id <> auth.uid())
  OR (user_is_part_of_conversation(conversation_id) AND sender_id <> auth.uid())
);

-- Drop old policies that only checked booking_id (they'll be replaced)
DROP POLICY IF EXISTS "Users can view messages from their bookings" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their bookings" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.chat_messages;

-- Enable realtime for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Function to update updated_at on conversations
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Trigger to update conversation timestamp when new message is sent
CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW
WHEN (NEW.conversation_id IS NOT NULL)
EXECUTE FUNCTION public.update_conversation_timestamp();

-- Migration: Link existing messages to conversations
-- For each message with a booking_id, find/create the conversation and link it
DO $$
DECLARE
  r RECORD;
  v_conv_id UUID;
BEGIN
  FOR r IN 
    SELECT DISTINCT cm.id as message_id, b.student_id, b.instructor_id
    FROM chat_messages cm
    JOIN bookings b ON b.id = cm.booking_id
    WHERE cm.conversation_id IS NULL
  LOOP
    -- Get or create conversation for this student-instructor pair
    SELECT id INTO v_conv_id
    FROM conversations
    WHERE student_id = r.student_id AND instructor_id = r.instructor_id;
    
    IF v_conv_id IS NULL THEN
      INSERT INTO conversations (student_id, instructor_id)
      VALUES (r.student_id, r.instructor_id)
      RETURNING id INTO v_conv_id;
    END IF;
    
    -- Update the message with the conversation_id
    UPDATE chat_messages
    SET conversation_id = v_conv_id
    WHERE id = r.message_id;
  END LOOP;
END $$;