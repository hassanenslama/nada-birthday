-- Add UPDATE policy for posts
CREATE POLICY "Users can update their own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Add UPDATE policy for comments
CREATE POLICY "Users can update their own comments" ON public.post_comments
    FOR UPDATE USING (auth.uid() = user_id);
