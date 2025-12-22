-- Add is_deleted to post_reactions
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'post_reactions' AND column_name = 'is_deleted') THEN
        ALTER TABLE public.post_reactions ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add is_deleted to comment_reactions
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comment_reactions' AND column_name = 'is_deleted') THEN
        ALTER TABLE public.comment_reactions ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;
END $$;
