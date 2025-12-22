-- Enable Realtime for Posts and Comments tables
-- Run this in your Supabase SQL Editor to ensure instant updates for other users

begin;
  -- Check if publication exists, if not create it (standard supabase setup usually has it)
  -- We just add tables to it.
  alter publication supabase_realtime add table posts;
  alter publication supabase_realtime add table post_comments;
  alter publication supabase_realtime add table post_reactions;
  alter publication supabase_realtime add table comment_reactions;
commit;
