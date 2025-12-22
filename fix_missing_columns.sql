-- Add avatar_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.user_profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Add display_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'display_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN display_name TEXT;
    END IF;
END $$;

-- Force schema cache reload (Supabase sometimes needs this)
NOTIFY pgrst, 'reload config';
