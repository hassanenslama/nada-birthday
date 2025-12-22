-- Add image_url column to post_comments table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'post_comments' AND column_name = 'image_url') THEN
        ALTER TABLE post_comments ADD COLUMN image_url TEXT;
    END IF;
END $$;
