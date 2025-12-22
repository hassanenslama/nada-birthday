-- Add parent_id to post_comments for nested replies
ALTER TABLE public.post_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE;

-- Enable recursive queries if needed in future, but RLS works fine with simple joins
-- No new policies needed as existing ones cover UPDATE/INSERT generally

-- Optional: Index on parent_id for performance
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON public.post_comments(parent_id);
