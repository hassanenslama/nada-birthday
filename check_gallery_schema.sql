-- Check actual schema of gallery_media and albums tables
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'gallery_media'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'albums'
ORDER BY ordinal_position;
