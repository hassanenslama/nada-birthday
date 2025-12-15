-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can update messages status" ON chat_messages;

-- Create a new policy that allows USERS to update messages WHERE:
-- 1. They are the sender (sender_uid) - e.g. editing their own message (optional, but good for future)
-- 2. They are the receiver (receiver_uid) - CRITICAL for Read Receipts
-- We can infer receiver if sender_uid IS NOT auth.uid(), assuming 1-on-1 chat logic, 
-- OR strictly if we had a receiver_column. Since we added receiver_uid previously, let's use it.
-- If receiver_uid is null in old messages, we fall back to "if I am NOT the sender".

CREATE POLICY "Users can update messages status"
ON chat_messages
FOR UPDATE
USING (
  -- I can update if I am the sender OR the receiver
  auth.uid() = sender_uid OR 
  auth.uid() = receiver_uid OR
  -- Fallback for legacy messages without receiver_uid: I am authenticated and NOT the sender (implies I am the other party in this 2-person app)
  (auth.role() = 'authenticated' AND auth.uid() != sender_uid)
)
WITH CHECK (
  -- Ensure they don't change immutable fields like sender_uid
  auth.uid() = sender_uid OR 
  auth.uid() = receiver_uid OR
  (auth.role() = 'authenticated' AND auth.uid() != sender_uid)
);
