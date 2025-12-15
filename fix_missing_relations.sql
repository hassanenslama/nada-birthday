-- Fix 400 Error: Link Notifications to User Profiles
-- The dashboard crashes (Error 400) because it tries to get user names, 
-- but the database doesn't technically know that 'notifications' are linked to 'user_profiles'.

-- 1. Add link between Recipient and Profile
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_recipient_id_fkey_profiles
FOREIGN KEY (recipient_id)
REFERENCES public.user_profiles(id)
ON DELETE CASCADE;

-- 2. Add link between Sender (Admin) and Profile (Good for future use)
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_created_by_fkey_profiles
FOREIGN KEY (created_by)
REFERENCES public.user_profiles(id)
ON DELETE SET NULL;
