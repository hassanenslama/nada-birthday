-- Add RLS policies for albums table
-- This allows users and admins to create and manage albums

-- Enable RLS if not already enabled
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if any
DROP POLICY IF EXISTS "Users can view all albums" ON albums;
DROP POLICY IF EXISTS "Albums are viewable by everyone" ON albums;
DROP POLICY IF EXISTS "Users can insert albums" ON albums;
DROP POLICY IF EXISTS "Users can insert own albums" ON albums;
DROP POLICY IF EXISTS "Users can update own albums" ON albums;
DROP POLICY IF EXISTS "Users can delete own albums" ON albums;

-- SELECT policy (everyone can view all albums)
CREATE POLICY "Albums are viewable by everyone"
  ON albums FOR SELECT
  USING (true);

-- INSERT policy (users can create albums, admins can create all)
CREATE POLICY "Users can insert albums"
  ON albums FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR is_admin()
  );

-- UPDATE policy (users can update their own albums, admins can update all)
CREATE POLICY "Users can update own albums"
  ON albums FOR UPDATE
  USING (
    auth.uid() = user_id
    OR is_admin()
    OR is_system = true  -- System albums can be viewed by anyone
  )
  WITH CHECK (
    auth.uid() = user_id
    OR is_admin()
  );

-- DELETE policy (users can delete their own albums, admins can delete all, but not system albums)
CREATE POLICY "Users can delete own albums"
  ON albums FOR DELETE
  USING (
    (auth.uid() = user_id OR is_admin())
    AND is_system = false  -- Cannot delete system albums
  );
