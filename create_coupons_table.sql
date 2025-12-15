-- Create Coupons Table
create table if not exists public.coupons (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    description text,
    section text not null check (section in ('nada', 'hassan')),
    style text not null default 'love', -- love, royal, freedom, foodie, magic
    is_used boolean default false,
    used_at timestamp with time zone,
    
    -- Optional: link to who created it (admin)
    created_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.coupons enable row level security;

-- Policies

-- 1. Everyone can read coupons
create policy "Everyone can view coupons"
on public.coupons for select
using (true);

-- 2. Allow authenticated users to insert/update/delete (Simplified for this private app)
-- Ideally strictly for admins, but for now we trust the text matching in frontend or we can refine later
create policy "Authenticated users can manage coupons"
on public.coupons for all
using (auth.role() = 'authenticated');

-- Realtime
alter publication supabase_realtime add table public.coupons;
