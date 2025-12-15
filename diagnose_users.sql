-- First, check the actual structure of user_profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Then let's see what users exist in auth.users
SELECT id, email, raw_user_meta_data FROM auth.users;
