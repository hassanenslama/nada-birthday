-- Create quiz_results table if it doesn't exist
create table if not exists quiz_results (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  score integer,
  answers jsonb,
  completed_at timestamp with time zone default now()
);

-- Enable RLS (safe to run multiple times)
alter table quiz_results enable row level security;

-- Drop all existing policies to avoid conflicts
drop policy if exists "Users can view own quiz results" on quiz_results;
drop policy if exists "Users can insert own quiz results" on quiz_results;
drop policy if exists "Users can update own quiz results" on quiz_results;
drop policy if exists "Users can delete own quiz results" on quiz_results;

-- Create comprehensive policies
create policy "Users can view own quiz results"
  on quiz_results for select
  using (auth.uid() = user_id);

create policy "Users can insert own quiz results"
  on quiz_results for insert
  with check (auth.uid() = user_id);

create policy "Users can update own quiz results"
  on quiz_results for update
  using (auth.uid() = user_id);

create policy "Users can delete own quiz results"
  on quiz_results for delete
  using (auth.uid() = user_id);
