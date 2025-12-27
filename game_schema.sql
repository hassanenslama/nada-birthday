-- Game Progress Schema
-- Run this in Supabase SQL Editor

-- 1. Create table for tracking progress per user, world, and level
create table if not exists game_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  world_id text not null, -- e.g., 'village', 'north_pole'
  level_id int not null,  -- e.g., 1, 2, 3
  stars int default 0,    -- 0 to 3
  score int default 0,    -- High score
  status text default 'locked', -- 'locked', 'unlocked', 'completed'
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Prevent duplicate entries for the same level per user
  unique(user_id, world_id, level_id)
);

-- 2. Enable RLS
alter table game_progress enable row level security;

-- 3. Create Policies

-- Users can view their own progress
create policy "Users can view own progress"
  on game_progress for select
  using (auth.uid() = user_id);

-- Users can insert/update their own progress (Game logic will handle the validity)
create policy "Users can update own progress"
  on game_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Indexes for fast lookup
create index if not exists game_progress_user_world_idx on game_progress(user_id, world_id);

-- 5. Helper Function to initialize first level for new users
-- (Optional: You can call this from your frontend code when a user opens the game for the first time)
-- or handle it via a trigger. For now, frontend logic is safer/easier to debug.
