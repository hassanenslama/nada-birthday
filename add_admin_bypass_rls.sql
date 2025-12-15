-- Add admin bypass to RLS for unlocked_memories
-- This allows admins to read ALL users' unlocked memories

-- First, we need a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now update the SELECT policy to allow admins to view all
DROP POLICY IF EXISTS "Users can view own unlocked memories" ON unlocked_memories;

CREATE POLICY "Users can view own or admin can view all unlocked memories"
  ON unlocked_memories FOR SELECT
  USING (
    auth.uid() = user_id  -- Own data
    OR is_admin()         -- OR is admin
  );

-- Keep INSERT/UPDATE policies the same (admin can manage via separate mechanism)
