-- Create Wishes Table for Bucket List
create table if not exists wishes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  created_by_role text not null check (created_by_role in ('admin', 'user')),
  status text not null default 'pending' check (status in ('pending', 'waiting_confirmation', 'completed')),
  proposed_by_role text check (proposed_by_role in ('admin', 'user')),
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
alter table wishes enable row level security;

-- Policies (Allow everything for simplicity between the couple)
create policy "Enable read access for all users" on wishes for select using (true);
create policy "Enable insert for all users" on wishes for insert with check (true);
create policy "Enable update for all users" on wishes for update using (true);
create policy "Enable delete for all users" on wishes for delete using (true);

-- Enable Realtime
alter publication supabase_realtime add table wishes;
