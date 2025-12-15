
-- 1. Enable RLS explicitly to be sure
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_media ENABLE ROW LEVEL SECURITY;

-- 2. ALBUMS POLICIES
-- Allow anyone to view
DROP POLICY IF EXISTS "Albums are viewable by everyone" ON public.albums;
CREATE POLICY "Albums are viewable by everyone" ON public.albums FOR SELECT USING (true);

-- Allow Insert: Users can insert their own
DROP POLICY IF EXISTS "Users can insert albums" ON public.albums;
CREATE POLICY "Users can insert albums" ON public.albums FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow Update: Owner OR Admin
DROP POLICY IF EXISTS "Users can update own albums" ON public.albums;
CREATE POLICY "Users can update own albums" ON public.albums 
FOR UPDATE USING (
  auth.uid() = user_id 
  OR (SELECT auth.jwt() ->> 'email') = 'hassanen@love.com'
);

-- Allow Delete: Owner OR Admin
DROP POLICY IF EXISTS "Users can delete own albums" ON public.albums;
CREATE POLICY "Users can delete own albums" ON public.albums 
FOR DELETE USING (
  auth.uid() = user_id 
  OR (SELECT auth.jwt() ->> 'email') = 'hassanen@love.com'
);


-- 3. GALLERY MEDIA POLICIES
-- Allow anyone to view
DROP POLICY IF EXISTS "Media is viewable by everyone" ON public.gallery_media;
CREATE POLICY "Media is viewable by everyone" ON public.gallery_media FOR SELECT USING (true);

-- Allow Insert: Users can upload
DROP POLICY IF EXISTS "Users can upload media" ON public.gallery_media;
CREATE POLICY "Users can upload media" ON public.gallery_media FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow Update: Owner OR Admin
DROP POLICY IF EXISTS "Users can update own media" ON public.gallery_media;
CREATE POLICY "Users can update own media" ON public.gallery_media 
FOR UPDATE USING (
  auth.uid() = user_id 
  OR (SELECT auth.jwt() ->> 'email') = 'hassanen@love.com'
);

-- Allow Delete: Owner OR Admin
DROP POLICY IF EXISTS "Users can delete own media" ON public.gallery_media;
CREATE POLICY "Users can delete own media" ON public.gallery_media 
FOR DELETE USING (
  auth.uid() = user_id 
  OR (SELECT auth.jwt() ->> 'email') = 'hassanen@love.com'
);
