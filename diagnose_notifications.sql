-- Diagnostic: Check recent notifications and their creators
SELECT 
    id, 
    title, 
    created_by, 
    recipient_id, 
    created_at,
    is_deleted
FROM public.notifications 
ORDER BY created_at DESC 
LIMIT 10;
