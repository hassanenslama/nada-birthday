-- Create unlocked_memories table
create table if not exists unlocked_memories (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ids jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default now()
);

-- Create custom_memories table
create table if not exists custom_memories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  description text,
  image text,
  date timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Create coupons table (if needed, checking component next)
create table if not exists redeemed_coupons (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  coupon_id text,
  redeemed_at timestamp with time zone default now()
);

-- Enable RLS
alter table unlocked_memories enable row level security;
alter table custom_memories enable row level security;
alter table redeemed_coupons enable row level security;

-- Policies for unlocked_memories
create policy "Users can view own unlocked memories"
  on unlocked_memories for select
  using (auth.uid() = user_id);

create policy "Users can insert/update own unlocked memories"
  on unlocked_memories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies for custom_memories
create policy "Users can view own custom memories"
  on custom_memories for select
  using (auth.uid() = user_id);

create policy "Users can insert own custom memories"
  on custom_memories for insert
  with check (auth.uid() = user_id);

-- Policies for redeemed_coupons
create policy "Users can view own redeemed coupons"
  on redeemed_coupons for select
  using (auth.uid() = user_id);

create policy "Users can insert own redeemed coupons"
  on redeemed_coupons for insert
  with check (auth.uid() = user_id);
