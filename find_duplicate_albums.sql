-- Check for duplicate Timeline albums
SELECT * FROM albums WHERE title LIKE '%تايم%' OR title LIKE '%Timeline%' OR id = 'timeline';

-- Delete the duplicate (keep only the one that works)
-- First, let's see all albums to identify which one to delete
SELECT id, title, created_at FROM albums ORDER BY created_at;
