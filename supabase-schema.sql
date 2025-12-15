-- Supabase Database Schema Setup
-- Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor)

-- 1. Enable UUID extension (if not already enabled)
create extension if not exists "uuid-ossp";

-- 2. Create user_profiles table
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  profile_picture text,
  bio text,
  bio_updated_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Create chat_messages table
create table if not exists chat_messages (
  id uuid primary key default uuid_generate_v4(),
  sender_uid uuid references auth.users(id) on delete cascade,
  sender_name text,
  text text,
  image text,
  type text default 'text',
  timestamp timestamp with time zone default now(),
  read boolean default false,
  reaction text,
  reply_to jsonb,
  created_at timestamp with time zone default now()
);

-- 4. Create user_settings table
create table if not exists user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  contact_key text,
  nickname text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. Enable Row Level Security
alter table user_profiles enable row level security;
alter table chat_messages enable row level security;
alter table user_settings enable row level security;

-- 6. Create policies for user_profiles (anyone can read, only owner can update)
create policy "User profiles are viewable by everyone"
  on user_profiles for select
  using (true);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

-- 7. Create policies for chat_messages (authenticated users can do everything)
create policy "Chat messages are viewable by authenticated users"
  on chat_messages for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert messages"
  on chat_messages for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update own messages"
  on chat_messages for update
  using (auth.uid() = sender_uid);

-- 8. Create policies for user_settings
create policy "User settings are viewable by owner"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on user_settings for update
  using (auth.uid() = user_id);

-- 9. Create indexes for performance
create index if not exists chat_messages_timestamp_idx on chat_messages(timestamp desc);
create index if not exists chat_messages_sender_idx on chat_messages(sender_uid);
create index if not exists user_settings_user_id_idx on user_settings(user_id);

-- 10. Enable realtime for chat_messages
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table user_profiles;
