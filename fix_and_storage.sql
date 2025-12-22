-- 1. Fix Relationships (Foreign Keys)
-- This allows PostgREST to join posts/comments with user_profiles
ALTER TABLE public.posts 
ADD CONSTRAINT fk_posts_user_profiles 
FOREIGN KEY (user_id) 
REFERENCES public.user_profiles(id);

ALTER TABLE public.post_comments 
ADD CONSTRAINT fk_comments_user_profiles 
FOREIGN KEY (user_id) 
REFERENCES public.user_profiles(id);


-- 2. Setup Storage for Avatars
-- Create 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'avatars'
-- Allow public access to view avatars
CREATE POLICY "Avatar Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatar
-- We organize files by user_id/filename to be safe, or just allow all auth users to upload
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update/delete their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
