-- Show all registered users and their emails
-- Run this to find the ACTUAL email addresses registered

SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;
