-- Add payload column for detailed notification actions (like Invitations)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;

-- Remove the restrictive type check to allow more flexibility (or just rely on payload)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Update INSERT policy to allow Users to send notifications (e.g. Invites)
-- First drop any existing/conflicting policies
DROP POLICY IF EXISTS "Admin can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications; -- Drop self to avoid duplication error

-- Create new policy: Users can insert notifications
CREATE POLICY "Users can insert notifications"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (true); -- Any authenticated user can send a notification
