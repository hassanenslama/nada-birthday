-- Fix relationships for monitoring features

-- 1. Post Reactions -> User Profiles
ALTER TABLE public.post_reactions 
ADD CONSTRAINT fk_post_reactions_user_profiles 
FOREIGN KEY (user_id) 
REFERENCES public.user_profiles(id);

-- 2. Comment Reactions -> User Profiles
ALTER TABLE public.comment_reactions 
ADD CONSTRAINT fk_comment_reactions_user_profiles 
FOREIGN KEY (user_id) 
REFERENCES public.user_profiles(id);

-- 3. Post Edits -> User Profiles (Editor)
ALTER TABLE public.post_edits 
ADD CONSTRAINT fk_post_edits_user_profiles 
FOREIGN KEY (editor_id) 
REFERENCES public.user_profiles(id);

-- 4. Comment Edits -> User Profiles (Editor)
ALTER TABLE public.comment_edits 
ADD CONSTRAINT fk_comment_edits_user_profiles 
FOREIGN KEY (editor_id) 
REFERENCES public.user_profiles(id);
