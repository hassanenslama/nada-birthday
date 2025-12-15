-- Fix RLS policies to allow Admin to update Unlocked Memories for ANY user
-- Assuming the admin (Hassanen) needs full access to this table.

-- 1. Enable RLS (if not already)
ALTER TABLE public.unlocked_memories ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies (if any)
DROP POLICY IF EXISTS "Users can view their own unlocked memories" ON public.unlocked_memories;
DROP POLICY IF EXISTS "Users can update their own unlocked memories" ON public.unlocked_memories;
DROP POLICY IF EXISTS "Allow Admin Access" ON public.unlocked_memories;
DROP POLICY IF EXISTS "Allow Admin Full Access" ON public.unlocked_memories;

-- 3. Create Policy: Users can VIEW their own
CREATE POLICY "Users can view their own unlocked memories" 
ON public.unlocked_memories FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Create Policy: Users can UPDATE (Upsert) their own - (Usually the app logic might need this if Nada plays the game)
CREATE POLICY "Users can update their own unlocked memories" 
ON public.unlocked_memories FOR ALL 
USING (auth.uid() = user_id);

-- 5. Create Policy: Admin (Hassanen) can do EVERYTHING on ALL rows
-- Using the email or specific ID of the admin. Better to use ID or a IsAdmin function if exists.
-- For now, verifying by email is safe enough for this specific app.
CREATE POLICY "Allow Admin Full Access" 
ON public.unlocked_memories FOR ALL 
USING (
  auth.email() = 'hassanen@love.com' 
  OR 
  auth.uid()::text = '1e965797-9b29-4851-bc13-fd51e5671bd6' -- Hassanen's ID from previous logs
);
