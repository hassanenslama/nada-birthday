-- Add is_deleted column to posts if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'is_deleted') THEN
        ALTER TABLE public.posts ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add is_deleted column to post_comments if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'post_comments' AND column_name = 'is_deleted') THEN
        ALTER TABLE public.post_comments ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create Post Edits Table
CREATE TABLE IF NOT EXISTS public.post_edits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    editor_id UUID REFERENCES auth.users(id) NOT NULL,
    old_content TEXT,
    new_content TEXT,
    edited_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Post Edits
ALTER TABLE public.post_edits ENABLE ROW LEVEL SECURITY;

-- Post Edits Policies
CREATE POLICY "Admins can view post edits" ON public.post_edits FOR SELECT USING (
    auth.jwt() ->> 'email' = 'hassanen@love.com' -- Simple admin check for now, ideally use role
);
CREATE POLICY "Users can insert their own post edits" ON public.post_edits FOR INSERT WITH CHECK (auth.uid() = editor_id);


-- Create Comment Edits Table
CREATE TABLE IF NOT EXISTS public.comment_edits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE NOT NULL,
    editor_id UUID REFERENCES auth.users(id) NOT NULL,
    old_content TEXT,
    new_content TEXT,
    edited_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Comment Edits
ALTER TABLE public.comment_edits ENABLE ROW LEVEL SECURITY;

-- Comment Edits Policies
CREATE POLICY "Admins can view comment edits" ON public.comment_edits FOR SELECT USING (
    auth.jwt() ->> 'email' = 'hassanen@love.com'
);
CREATE POLICY "Users can insert their own comment edits" ON public.comment_edits FOR INSERT WITH CHECK (auth.uid() = editor_id);

-- Ensure admins can view hidden reactions (if not already allowed by "Anyone can view..." generic policies)
-- The existing policies might be "Anyone can view", which includes admins. 
-- But let's make sure we don't have row-level security blocking "is_hidden" rows if we were filtering them out in the query policy.
-- Actually, the current "Anyone can view..." usually means `USING (true)`, so all rows are visible to everyone, filtered only by frontend. 
-- So no extra policy needed for viewing hidden reactions if the policy is `USING (true)`.

