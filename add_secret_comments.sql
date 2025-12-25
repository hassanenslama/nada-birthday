-- Add is_secret column to post_comments table
ALTER TABLE post_comments 
ADD COLUMN IF NOT EXISTS is_secret BOOLEAN DEFAULT FALSE;

-- Policy to allow users to see their own secret comments (RLS if needed later)
-- For now, relying on frontend filtering as requested for speed/prototype style.
