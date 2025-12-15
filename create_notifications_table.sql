-- First, check if notifications table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Create Notifications Table
        CREATE TABLE public.notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
            recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- Enable RLS
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

        -- Users can view their own notifications or admin can view all
        CREATE POLICY "Users can view own notifications"
            ON public.notifications FOR SELECT
            USING (auth.uid() = recipient_id OR is_admin());

        -- Admin can insert notifications for anyone
        CREATE POLICY "Admin can insert notifications"
            ON public.notifications FOR INSERT
            WITH CHECK (is_admin());

        -- Users can update only is_read on their own notifications
        CREATE POLICY "Users can update own notifications read status"
            ON public.notifications FOR UPDATE
            USING (auth.uid() = recipient_id)
            WITH CHECK (auth.uid() = recipient_id);

        -- Users can delete their own notifications, admin can delete all
        CREATE POLICY "Users can delete own notifications"
            ON public.notifications FOR DELETE
            USING (auth.uid() = recipient_id OR is_admin());

        -- Create indexes for faster queries
        CREATE INDEX notifications_recipient_id_idx ON public.notifications(recipient_id);
        CREATE INDEX notifications_created_at_idx ON public.notifications(created_at DESC);

        -- Enable Realtime
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

        RAISE NOTICE 'Notifications table created successfully!';
    ELSE
        RAISE NOTICE 'Notifications table already exists, skipping creation.';
    END IF;
END $$;
