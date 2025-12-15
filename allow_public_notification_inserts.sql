-- Allow authenticated users to insert notifications for ANY recipient
-- This is necessary for peer-to-peer notifications (e.g. Nada sending to Hassan)

DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated'
);

-- Ensure RLS is enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Grant INSERT permission to authenticated role
GRANT INSERT ON public.notifications TO authenticated;
