-- Add RLS policies for gallery_media table
-- This allows users and admins to upload photos

-- Enable RLS if not already enabled
ALTER TABLE gallery_media ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if any
DROP POLICY IF EXISTS "Users can view all gallery media" ON gallery_media;
DROP POLICY IF EXISTS "Media is viewable by everyone" ON gallery_media;
DROP POLICY IF EXISTS "Users can upload media" ON gallery_media;
DROP POLICY IF EXISTS "Users can insert own gallery media" ON gallery_media;
DROP POLICY IF EXISTS "Users can update own media" ON gallery_media;
DROP POLICY IF EXISTS "Users can update own gallery media" ON gallery_media;
DROP POLICY IF EXISTS "Users can delete own media" ON gallery_media;
DROP POLICY IF EXISTS "Users can delete own gallery media" ON gallery_media;

-- SELECT policy (everyone can view all photos)
CREATE POLICY "Media is viewable by everyone"
  ON gallery_media FOR SELECT
  USING (true);

-- INSERT policy (users can insert their own photos, admins can insert all)
CREATE POLICY "Users can upload media"
  ON gallery_media FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR is_admin()
  );

-- UPDATE policy (users can update their own photos, admins can update all)
CREATE POLICY "Users can update own media"
  ON gallery_media FOR UPDATE
  USING (
    auth.uid() = user_id
    OR is_admin()
  )
  WITH CHECK (
    auth.uid() = user_id
    OR is_admin()
  );

-- DELETE policy (users can delete their own photos, admins can delete all)
CREATE POLICY "Users can delete own media"
  ON gallery_media FOR DELETE
  USING (
    auth.uid() = user_id
    OR is_admin()
  );
