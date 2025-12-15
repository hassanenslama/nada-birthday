-- 1. CLEANUP DUPLICATES
-- Delete duplicate 'Timeline' albums, keeping only the oldest one (or one of them)
DELETE FROM public.albums
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
        ROW_NUMBER() OVER (partition BY title ORDER BY created_at ASC) as rnum
        FROM public.albums
        WHERE title = 'ذكرياتنا (التايم لاين)'
    ) t
    WHERE t.rnum > 1
);

-- 2. ADD LOCKING COLUMN
-- Add is_locked column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gallery_media' AND column_name = 'is_locked') THEN
        ALTER TABLE public.gallery_media ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. ENSURE RLS policies are correct (idempotent)
-- (Existing policies are fine, no need to recreate if they exist, but good to be safe)
