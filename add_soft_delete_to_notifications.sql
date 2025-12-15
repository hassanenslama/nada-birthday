-- Enable Soft Deletes for Notifications
-- This allows admins to track notifications even after users "delete" them

-- 1. Add columns
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Backfill existing data
UPDATE public.notifications 
SET is_deleted = FALSE 
WHERE is_deleted IS NULL;

-- 3. Add Index for performance (since we filter by is_deleted now)
CREATE INDEX IF NOT EXISTS notifications_is_deleted_idx ON public.notifications(is_deleted);

