-- Verify RLS policies are correct
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'unlocked_memories';

-- Check if there's any data
SELECT * FROM unlocked_memories;
