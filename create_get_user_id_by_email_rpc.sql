-- Drop the function if it exists to allow changing parameter names
DROP FUNCTION IF EXISTS get_user_id_by_email(text);
DROP FUNCTION IF EXISTS get_user_id_by_email;

-- Create RPC function to get user ID by email
-- This function is used to find the recipient ID when sending notifications

CREATE OR REPLACE FUNCTION get_user_id_by_email(email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id uuid;
BEGIN
    -- Try to find user in auth.users first
    SELECT id INTO user_id
    FROM auth.users
    WHERE auth.users.email = get_user_id_by_email.email
    LIMIT 1;
    
    -- Return the user ID (will be NULL if not found)
    RETURN user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_id_by_email(text) TO authenticated;
