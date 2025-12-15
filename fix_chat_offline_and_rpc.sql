-- 1. Create Profiles Table (Safe Check)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at timestamp with time zone,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  website text,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- 2. Create Config Table (Safe Check)
CREATE TABLE IF NOT EXISTS public.config (
    key text PRIMARY KEY,
    value text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 5. Policies for Config (Fixing 406 Error)
DROP POLICY IF EXISTS "Config is viewable by everyone" ON public.config;
CREATE POLICY "Config is viewable by everyone" ON public.config FOR SELECT USING (true);

-- 6. FIX RPC Function - Explicitly accepting 'email' parameter
DROP FUNCTION IF EXISTS get_user_id_by_email(text);

CREATE OR REPLACE FUNCTION get_user_id_by_email(email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_id uuid;
BEGIN
  SELECT id INTO found_id
  FROM auth.users
  WHERE auth.users.email = get_user_id_by_email.email;
  
  RETURN found_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_id_by_email(text) TO anon, authenticated, service_role;
