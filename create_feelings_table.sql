-- Create Feelings Table
create table if not exists feelings (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  image_url text,
  sender_role text not null check (sender_role in ('admin', 'user')),
  created_at timestamptz default now()
);

-- RLS
alter table feelings enable row level security;

create policy "Enable read access for all users" on feelings for select using (true);
create policy "Enable insert for all users" on feelings for insert with check (true);
create policy "Enable update for all users" on feelings for update using (true);
create policy "Enable delete for all users" on feelings for delete using (true);

-- Realtime
alter publication supabase_realtime add table feelings;
