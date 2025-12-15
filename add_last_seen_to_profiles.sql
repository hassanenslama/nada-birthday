-- Add tracking columns to user_profiles
DO $$
BEGIN
    -- Last Seen (Time)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_seen') THEN
        ALTER TABLE public.user_profiles ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Last IP Address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_ip') THEN
        ALTER TABLE public.user_profiles ADD COLUMN last_ip TEXT;
    END IF;

    -- Device Info (User Agent or parsed name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'device_info') THEN
        ALTER TABLE public.user_profiles ADD COLUMN device_info TEXT;
    END IF;
END $$;

-- Update RLS policies to allow users to update their own tracking info
DROP POLICY IF EXISTS "Users can update their own tracking info" ON public.user_profiles;
CREATE POLICY "Users can update their own tracking info"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure Admins (Hassanen) can view everything is covered by existing policy:
-- "Profiles are viewable by everyone" (created in previous step)
-- If not, re-create it:
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.user_profiles;
CREATE POLICY "Profiles are viewable by everyone"
ON public.user_profiles FOR SELECT
USING (true);
