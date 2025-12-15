
-- Update RLS for Albums
DROP POLICY IF EXISTS "Users can update own albums" ON public.albums;
CREATE POLICY "Users can update own albums" ON public.albums
    FOR UPDATE USING (auth.uid() = user_id OR (SELECT auth.jwt() ->> 'email') = 'hassanen@love.com');

DROP POLICY IF EXISTS "Users can delete own albums" ON public.albums;
CREATE POLICY "Users can delete own albums" ON public.albums
    FOR DELETE USING (auth.uid() = user_id OR (SELECT auth.jwt() ->> 'email') = 'hassanen@love.com');


-- Update RLS for Gallery Media
DROP POLICY IF EXISTS "Users can update own media" ON public.gallery_media;
CREATE POLICY "Users can update own media" ON public.gallery_media
    FOR UPDATE USING (auth.uid() = user_id OR (SELECT auth.jwt() ->> 'email') = 'hassanen@love.com');

DROP POLICY IF EXISTS "Users can delete own media" ON public.gallery_media;
CREATE POLICY "Users can delete own media" ON public.gallery_media
    FOR DELETE USING (auth.uid() = user_id OR (SELECT auth.jwt() ->> 'email') = 'hassanen@love.com');
