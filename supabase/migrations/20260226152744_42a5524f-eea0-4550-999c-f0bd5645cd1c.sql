
-- 1) Add driving_school_id to conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS driving_school_id uuid REFERENCES instructor_profiles(id);

CREATE INDEX IF NOT EXISTS idx_conversations_driving_school 
ON conversations(driving_school_id);

-- 2) Update existing conversations of affiliated instructors
UPDATE conversations c
SET driving_school_id = dsi.driving_school_id
FROM instructor_profiles ip
JOIN driving_school_instructors dsi ON dsi.linked_user_id = ip.user_id
  AND dsi.status = 'active' 
  AND dsi.is_account_linked = true
WHERE c.instructor_id = ip.id
  AND c.driving_school_id IS NULL;

-- 3) RLS: driving school can view conversations
CREATE POLICY "driving_school_view_conversations" ON conversations
FOR SELECT USING (
  driving_school_id IN (
    SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
  )
);

-- 4) RLS: driving school can view messages of linked conversations
CREATE POLICY "driving_school_view_messages" ON chat_messages
FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE driving_school_id IN (
      SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
    )
  )
);

-- 5) RLS: driving school can send messages in linked conversations
CREATE POLICY "driving_school_send_messages" ON chat_messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE driving_school_id IN (
      SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
    )
  )
);

-- 6) RLS: driving school can mark messages as read in linked conversations
CREATE POLICY "driving_school_mark_read_messages" ON chat_messages
FOR UPDATE USING (
  sender_id <> auth.uid() AND
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE driving_school_id IN (
      SELECT id FROM instructor_profiles WHERE user_id = auth.uid()
    )
  )
);

-- 7) Create otp_codes table for unlinking feature
CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  code text NOT NULL,
  purpose text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, purpose)
);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own OTPs" ON otp_codes
  FOR SELECT USING (user_id = auth.uid());

-- Allow edge function (service role) to manage OTPs, users can only read their own
