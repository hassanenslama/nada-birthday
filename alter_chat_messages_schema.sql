-- Add columns for Edit and Delete features
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Update RLS Policy to allow users to UPDATE their own messages
-- First, drop existing update policy if it exists to avoid conflict
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;

CREATE POLICY "Users can update their own messages"
ON chat_messages FOR UPDATE
USING (auth.uid() = sender_uid)
WITH CHECK (auth.uid() = sender_uid);

-- Ensure Realtime is enabled for UPDATE events (usually enabled by default if REPLICA IDENTITY FULL, but good to check)
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages; 
-- (Assuming realtime is already set up for inserts, updates typically propagate if column list isn't restricted)
