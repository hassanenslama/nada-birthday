-- Create Albums Table
CREATE TABLE IF NOT EXISTS public.albums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    cover_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_system BOOLEAN DEFAULT FALSE, -- For 'All Photos' or generic containers
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE -- Owner
);

-- Establish RLS for Albums (Drop first to avoid duplication errors)
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Albums are viewable by everyone" ON public.albums;
CREATE POLICY "Albums are viewable by everyone" ON public.albums
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert albums" ON public.albums;
CREATE POLICY "Users can insert albums" ON public.albums
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own albums" ON public.albums;
CREATE POLICY "Users can update own albums" ON public.albums
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own albums" ON public.albums;
CREATE POLICY "Users can delete own albums" ON public.albums
    FOR DELETE USING (auth.uid() = user_id);


-- Create Gallery Media Table
CREATE TABLE IF NOT EXISTS public.gallery_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    title TEXT, -- Preserving 'title' from timeline
    caption TEXT, -- Preserving 'description' from timeline
    date DATE, -- Optional date
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Uploader
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE
);

-- Establish RLS for Gallery Media (Drop first to avoid duplication errors)
ALTER TABLE public.gallery_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Media is viewable by everyone" ON public.gallery_media;
CREATE POLICY "Media is viewable by everyone" ON public.gallery_media
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can upload media" ON public.gallery_media;
CREATE POLICY "Users can upload media" ON public.gallery_media
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own media" ON public.gallery_media;
CREATE POLICY "Users can update own media" ON public.gallery_media
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own media" ON public.gallery_media;
CREATE POLICY "Users can delete own media" ON public.gallery_media
    FOR DELETE USING (auth.uid() = user_id);


-- SEED DATA: Migrate existing timeline data
DO $$
DECLARE
    timeline_album_id UUID;
    my_uid UUID;
BEGIN
    -- Get a user ID to assign ownership (prefer Hassanen if exists, else first user)
    SELECT id INTO my_uid FROM auth.users LIMIT 1;

    -- Create 'Timeline' album if not exists
    INSERT INTO public.albums (title, cover_image, is_system, user_id)
    VALUES ('ذكرياتنا (التايم لاين)', '/images/timeline/1.jpg', TRUE, my_uid)
    ON CONFLICT DO NOTHING;

    -- Get the ID
    SELECT id INTO timeline_album_id FROM public.albums WHERE title = 'ذكرياتنا (التايم لاين)' LIMIT 1;

    -- CLEAR EXISTING MEDIA ONLY from this album to prevent duplicates and ensure clean state (removes dates)
    DELETE FROM public.gallery_media WHERE album_id = timeline_album_id;

    -- Insert Data (Mapped from timeline.js) - DATES SET TO NULL
    -- 1
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/1.jpg', 'اول صوره خدناها سوا', 'اول صوره تجمعني بأجمل ما رأت عيني واحلي حاجه حصلتلي في حياتي', NULL, my_uid);
    -- 2
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/2.jpg', 'مشاعر رهيبه', 'الصوره دي من ضمن بعض من الصور الي انا متعلق بيها ،وحقيقي بتحمل عندي مشاعر رهيبه كل مره بفتكرها', NULL, my_uid);
    -- 3
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/3.jpg', 'بنوتي الكيوت', 'خلافا لشكلي الغريب😂 الا ان الصوره شايفك فيها بنوتي الكيوت اوي', NULL, my_uid);
    -- 4
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/4.jpg', 'ازاي لايقين كدا؟', 'انا كل ما ببص للصوره دي وصوره تانيه مبقولش غير،هو ازاي احنا لايقين كدا علي بعض؟', NULL, my_uid);
    -- 5
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/5.jpg', 'يا رب تبقي مراتي', 'دي الصوره التانيه الي حقيقي بقول الله يا رب تبقي مراتي ،حقيقي شكلك كان كيوت اوي وحقيقي كنتي حلوه اوي اليوم ده', NULL, my_uid);
    -- 6
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/6.jpg', 'بعشقها بجد', 'اكتر صوره بعشقها بجد ولازلت وهفضل بحبها وكل ما اشوفها افتكر مشاعري اليوم ده', NULL, my_uid);
    -- 7
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/7.jpg', 'طقم مخصوص عشانك', 'اليوم ده انا لبست الطقم ده مخصوص عشان كنتي بتحبيه والاستايل ده لقتني فيه اوي اوي', NULL, my_uid);
     -- 8
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/8.jpg', 'انا بحبك', 'صوره بعنوان انا بحبك', NULL, my_uid);
     -- 9
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/9.jpg', 'بنوتي اهي', 'الصوره دي لو هوصفها بوصف واحد فهو بنوتي اهي', NULL, my_uid);
     -- 10
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/10.jpg', 'يوم تاريخي', 'اليوم ده تاريخي ومستحيل يتشال من ذاكرتي،اول يوم شيلتك فيه اول يوم بوستك فيه واول بوسه في حياتي وكانت مع اجمل بنت وست البنات', NULL, my_uid);
     -- 11
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/11.jpg', 'Cloudy with a Chance of Meatballs', 'النسخه الواقعيه 😂', NULL, my_uid);
     -- 12
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/12.jpg', 'انتي مراتي', 'حلوه ومنوره ويا رب تبقي مراتي يا ندى "ده اليوم الي اتقال فيه انك مراتي من الست"', NULL, my_uid);
     -- 13
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/13.jpg', 'الصلح خير', 'اليوم ده كنا نازلين نفركش،شوفتيني بردان خوفتي عليا ومشينا سوا عشان اجيب قميص واتصالحنا', NULL, my_uid);
     -- 14
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/14.jpg', 'حلاوته يا ناس', 'يا نااس شوفو حلاوته يا نااس 😂♥', NULL, my_uid);
     -- 15
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/15.jpg', 'كل تفصيلة', 'انا حقيقي وانا بشوف الصور دي افتكرت كل تفصيله في اليوم ده كامله،حتي بعد ما روحنا', NULL, my_uid);
     -- 16
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/16.jpg', 'لايقين جداً', 'طيب بزمتك مش لايقين علي بعض جدا ؟', NULL, my_uid);
     -- 17
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/17.jpg', 'مفيش أحلى من كدا', 'حقيقي مفيش احلي من كدا في الدنيا كلها', NULL, my_uid);
     -- 18
    INSERT INTO public.gallery_media (album_id, url, title, caption, date, user_id)
    VALUES (timeline_album_id, '/images/timeline/18.jpg', 'بحبك جداً', 'كيوت جدا ولايقين علي بعض جدا وشكلك حلو جدا وبحبك جدا', NULL, my_uid);

END $$;
