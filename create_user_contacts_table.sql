-- Create user_contacts table for mapping partners
CREATE TABLE IF NOT EXISTS user_contacts (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, partner_id)
);

-- Enable RLS
ALTER TABLE user_contacts ENABLE ROW LEVEL SECURITY;

-- Policy: users can view their own contacts
CREATE POLICY "Users can view own contacts"
  ON user_contacts FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: users can update their nicknames for partners
CREATE POLICY "Users can update own contact nicknames"
  ON user_contacts FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert initial partner mappings
-- NOTE: Update these UUIDs with actual user IDs from auth.users
-- Run this query first to get IDs:
-- SELECT id, email FROM auth.users WHERE email IN ('nada@love.com', 'hassanen@love.com');

-- Then replace NADA_UUID and HASSANEN_UUID below with actual values

-- INSERT INTO user_contacts (user_id, partner_id)
-- VALUES 
--   ('NADA_UUID', 'HASSANEN_UUID'),
--   ('HASSANEN_UUID', 'NADA_UUID');

-- For now, this will be done programmatically in the app
