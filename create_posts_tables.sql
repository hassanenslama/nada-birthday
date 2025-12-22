-- Create Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT,
    image_url TEXT,
    link_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Post Policies
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Create Post Reactions Table
CREATE TABLE IF NOT EXISTS public.post_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id) -- One reaction per user per post
);

-- Enable RLS for Post Reactions
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- Post Reaction Policies
CREATE POLICY "Anyone can view reactions" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can react" ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their reaction" ON public.post_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove their reaction" ON public.post_reactions FOR DELETE USING (auth.uid() = user_id);

-- Create Post Comments Table
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Comment Policies
CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- Create Comment Reactions Table
CREATE TABLE IF NOT EXISTS public.comment_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(comment_id, user_id) -- One reaction per user per comment
);

-- Enable RLS for Comment Reactions
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- Comment Reaction Policies
CREATE POLICY "Anyone can view comment reactions" ON public.comment_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can react to comments" ON public.comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their comment reaction" ON public.comment_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove their comment reaction" ON public.comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.post_reactions TO authenticated;
GRANT ALL ON public.post_comments TO authenticated;
GRANT ALL ON public.comment_reactions TO authenticated;
