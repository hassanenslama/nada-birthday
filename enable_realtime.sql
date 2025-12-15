-- Enable Realtime for Gallery Tables
begin;
  -- Remove if already exists to avoid error (optional, but safe to just add)
  -- Add tables to the publication
  alter publication supabase_realtime add table gallery_media;
  alter publication supabase_realtime add table albums;
commit;
