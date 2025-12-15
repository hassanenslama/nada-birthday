-- Create RPC function to find user by email
CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT id 
  FROM auth.users 
  WHERE email = user_email
  LIMIT 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_id_by_email(TEXT) TO authenticated;
