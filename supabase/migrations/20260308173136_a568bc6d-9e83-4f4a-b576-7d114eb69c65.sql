
-- Drop all existing policies on chat_messages
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can mark conversation messages as read" ON public.chat_messages;
DROP POLICY IF EXISTS "driving_school_mark_read_me" ON public.chat_messages;

-- Recreate as PERMISSIVE policies

-- SELECT: users can read messages from their bookings or conversations
CREATE POLICY "Users can view messages from their conversations"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    user_is_part_of_booking(booking_id)
    OR user_is_part_of_conversation(conversation_id)
  );

-- INSERT: users can send messages to their bookings or conversations
CREATE POLICY "Users can send messages to their conversations"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      user_is_part_of_booking(booking_id)
      OR user_is_part_of_conversation(conversation_id)
    )
  );

-- UPDATE: users can mark messages as read (not their own) in their bookings/conversations
CREATE POLICY "Users can mark conversation messages as read"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (
    sender_id <> auth.uid()
    AND (
      user_is_part_of_booking(booking_id)
      OR user_is_part_of_conversation(conversation_id)
    )
  );

-- Driving school can view messages from affiliated conversations
CREATE POLICY "Driving school can view affiliated messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = chat_messages.conversation_id
      AND c.driving_school_id IN (
        SELECT ip.id FROM instructor_profiles ip
        WHERE ip.user_id = auth.uid() AND ip.is_driving_school = true
      )
    )
  );

-- Driving school can mark affiliated messages as read
CREATE POLICY "Driving school can mark affiliated messages read"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (
    sender_id <> auth.uid()
    AND conversation_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = chat_messages.conversation_id
      AND c.driving_school_id IN (
        SELECT ip.id FROM instructor_profiles ip
        WHERE ip.user_id = auth.uid() AND ip.is_driving_school = true
      )
    )
  );
