-- Ensure booking_id is nullable in chat_messages
ALTER TABLE chat_messages ALTER COLUMN booking_id DROP NOT NULL;

-- Add default null for booking_id
ALTER TABLE chat_messages ALTER COLUMN booking_id SET DEFAULT NULL;