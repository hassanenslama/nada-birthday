-- Truncate chat_messages to clear all chat history
TRUNCATE TABLE chat_messages;

-- Truncate notifications to clear all game invites and other alerts
TRUNCATE TABLE notifications;

-- Optional: If user wants to reset profiles (bio, nicknames), uncomment below:
-- TRUNCATE TABLE user_profiles; 
-- (Keeping profiles is safer unless explicitly asked to reset accounts)
