-- Add INSERT and UPDATE permissions for admins
-- This allows admins to lock/unlock memories for any user

-- Add INSERT policy for admins
DROP POLICY IF EXISTS "Users can insert own unlocked memories" ON unlocked_memories;

CREATE POLICY "Users can insert own or admin can insert all unlocked memories"
  ON unlocked_memories FOR INSERT
  WITH CHECK (
    auth.uid() = user_id  -- Own data
    OR is_admin()         -- OR is admin
  );

-- Add UPDATE policy for admins
DROP POLICY IF EXISTS "Users can update own unlocked memories" ON unlocked_memories;

CREATE POLICY "Users can update own or admin can update all unlocked memories"
  ON unlocked_memories FOR UPDATE
  USING (
    auth.uid() = user_id  -- Own data
    OR is_admin()         -- OR is admin
  )
  WITH CHECK (
    auth.uid() = user_id  -- Can only update to own user_id
    OR is_admin()         -- OR is admin (can update any user_id)
  );
