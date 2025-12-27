-- Create Game Scores Table
create table if not exists game_scores (
  id uuid primary key default uuid_generate_v4(),
  user_role text not null, -- 'admin' (Hassanen) or 'user' (Nada)
  score integer not null,
  game_name text default 'love_delivery',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table game_scores enable row level security;

-- Policies
create policy "Scores are viewable by everyone"
  on game_scores for select
  using (true);

create policy "Authenticated users can insert scores"
  on game_scores for insert
  with check (auth.role() = 'authenticated');
