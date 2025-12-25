-- Add is_secret column to posts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'is_secret') THEN
        ALTER TABLE posts ADD COLUMN is_secret BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
