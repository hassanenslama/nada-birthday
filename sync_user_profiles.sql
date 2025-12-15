-- Sync user_profiles with auth.users
-- Backfill missing users who logged in but don't have profiles

-- Step 1: Check current state
SELECT 'Auth Users:' as info, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'User Profiles:', COUNT(*) FROM user_profiles;

-- Step 2: Create function to auto-populate user_profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger for new signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Backfill existing users (add anyone missing from user_profiles)
INSERT INTO public.user_profiles (id, display_name, created_at)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as display_name,
    u.created_at
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 5: Verify results
SELECT 'Final Count - User Profiles:' as info, COUNT(*) as count FROM user_profiles
UNION ALL
SELECT 'Users successfully synced:', COUNT(*) FROM user_profiles p 
JOIN auth.users u ON p.id = u.id;

-- Step 6: Show all current user profiles with their auth emails
SELECT 
    p.id, 
    p.display_name,
    u.email,
    p.created_at 
FROM public.user_profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at;
