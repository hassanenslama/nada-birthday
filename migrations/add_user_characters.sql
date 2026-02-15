-- =============================================
-- User Characters Table
-- Tracks which characters each user has unlocked
-- =============================================

CREATE TABLE IF NOT EXISTS user_characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    character_id TEXT NOT NULL,
    unlocked BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, character_id)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_user_characters_user_id ON user_characters(user_id);

-- =============================================
-- Row Level Security Policies
-- =============================================

ALTER TABLE user_characters ENABLE ROW LEVEL SECURITY;

-- Users can only view their own characters
DROP POLICY IF EXISTS "Users can view own characters" ON user_characters;
CREATE POLICY "Users can view own characters"
    ON user_characters FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own characters
DROP POLICY IF EXISTS "Users can insert own characters" ON user_characters;
CREATE POLICY "Users can insert own characters"
    ON user_characters FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own characters
DROP POLICY IF EXISTS "Users can update own characters" ON user_characters;
CREATE POLICY "Users can update own characters"
    ON user_characters FOR UPDATE
    USING (auth.uid() = user_id);

-- =============================================
-- Function: Initialize Default Characters
-- Auto-unlocks Mr. Santa and Mrs. Santa for new users
-- =============================================

CREATE OR REPLACE FUNCTION initialize_default_characters()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-unlock default characters for new users
    INSERT INTO user_characters (user_id, character_id, unlocked, purchased_at)
    VALUES 
        (NEW.id, 'mr-santa', TRUE, NOW()),
        (NEW.id, 'mrs-santa', TRUE, NOW())
    ON CONFLICT (user_id, character_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Trigger: On New User Creation
-- Automatically initializes default characters
-- =============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_default_characters();

-- =============================================
-- Backfill: Initialize characters for existing users
-- Run this once to give existing users their default characters
-- =============================================

INSERT INTO user_characters (user_id, character_id, unlocked, purchased_at)
SELECT 
    u.id as user_id,
    chars.character_id,
    TRUE as unlocked,
    NOW() as purchased_at
FROM auth.users u
CROSS JOIN (
    VALUES ('mr-santa'), ('mrs-santa')
) AS chars(character_id)
ON CONFLICT (user_id, character_id) DO NOTHING;
