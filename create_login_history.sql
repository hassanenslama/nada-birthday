-- Create login_history table
CREATE TABLE IF NOT EXISTS public.login_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    device_info TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own logs
DROP POLICY IF EXISTS "Users can insert own logs" ON public.login_history;
CREATE POLICY "Users can insert own logs" ON public.login_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow reading (for Admin Dashboard)
DROP POLICY IF EXISTS "Everyone can read logs" ON public.login_history;
CREATE POLICY "Everyone can read logs" ON public.login_history
FOR SELECT
USING (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_login_history_user_created ON public.login_history(user_id, created_at DESC);
