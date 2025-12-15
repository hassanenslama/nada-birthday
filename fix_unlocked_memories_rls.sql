-- Fix RLS policies for unlocked_memories to allow users to INSERT their own rows

-- Drop ALL existing policies on unlocked_memories
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'unlocked_memories') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON unlocked_memories';
    END LOOP;
END $$;

-- Create proper policies
CREATE POLICY "Users can view own unlocked memories"
  ON unlocked_memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own unlocked memories"
  ON unlocked_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own unlocked memories"
  ON unlocked_memories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure Realtime is enabled (this will fail silently if already added, which is fine)
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE unlocked_memories;
EXCEPTION 
    WHEN duplicate_object THEN NULL;
END $$;
