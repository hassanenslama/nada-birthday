-- Add Ghost Mode to User Profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_ghost_mode BOOLEAN DEFAULT FALSE;

-- Policy to allow users to update their own ghost mode
-- (Assuming existing update policy covers 'user_profiles' based on ID)
