-- Game Leaderboard Table for Christmas Adventure
-- Add this to your Supabase SQL Editor

-- Create game_leaderboard table
create table if not exists game_leaderboard (
  id uuid primary key default uuid_generate_v4(),
  player_name text not null,
  score integer not null,
  coins integer default 0,
  hearts integer default 0,
  character text not null, -- 'mr-santa' or 'mrs-santa'
  created_at timestamp with time zone default now()
);

-- Add index for faster queries
create index if not exists game_leaderboard_score_idx on game_leaderboard(score desc);
create index if not exists game_leaderboard_created_idx on game_leaderboard(created_at desc);

-- Enable Row Level Security
alter table game_leaderboard enable row level security;

-- Allow anyone to read leaderboard
create policy "Leaderboard is viewable by everyone"
  on game_leaderboard for select
  using (true);

-- Allow authenticated users to insert scores
create policy "Authenticated users can insert scores"
  on game_leaderboard for insert
  with check (auth.role() = 'authenticated' or true); -- Allow anonymous too

-- Enable realtime for live updates
alter publication supabase_realtime add table game_leaderboard;
