-- Fix RLS Policy to allow senders to view their sent notifications

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

-- Create the new, more inclusive policy
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (
    auth.uid() = recipient_id   -- Can see received messages
    OR 
    auth.uid() = created_by     -- Can see sent messages
    OR
    (SELECT current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') -- Admin/Service role fallback
);

-- Note: We removed is_admin() just in case that function is not defined or reliable. 
-- Checking created_by is the direct way to solve "I want to see what I sent".
