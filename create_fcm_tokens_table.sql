create table if not exists user_fcm_tokens (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    token text not null,
    platform text default 'web',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table user_fcm_tokens enable row level security;

create policy "Users can insert their own tokens"
    on user_fcm_tokens for insert
    with check (auth.uid() = user_id);

create policy "Users can select their own tokens"
    on user_fcm_tokens for select
    using (auth.uid() = user_id);
