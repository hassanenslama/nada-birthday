-- Fix: Simple admin bypass without checking role column
-- Just check if user's email is the admin email

-- STEP 1: Drop policies first (they depend on the function)
DROP POLICY IF EXISTS "Users can view own or admin can view all unlocked memories" ON unlocked_memories;
DROP POLICY IF EXISTS "Users can view own unlocked memories" ON unlocked_memories;

-- STEP 2: Now we can safely drop and recreate the function
DROP FUNCTION IF EXISTS is_admin();

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get current user's email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Check if email is hassanein's (admin)
  -- You can change this to your actual admin email
  RETURN user_email = 'hassanen@love.com' OR user_email LIKE '%hassanen%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Recreate the SELECT policy with the fixed function
CREATE POLICY "Users can view own or admin can view all unlocked memories"
  ON unlocked_memories FOR SELECT
  USING (
    auth.uid() = user_id  -- Own data
    OR is_admin()         -- OR is admin
  );
