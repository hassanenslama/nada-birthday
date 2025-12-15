-- ⚠️ RUN THIS IN SUPABASE SQL EDITOR TO RESET APP STATE ⚠️

-- 1. Clear all chat history (Clean slate for messages)
TRUNCATE TABLE chat_messages RESTART IDENTITY CASCADE;

-- 2. Clear all notifications (Game invites, system alerts)
TRUNCATE TABLE notifications RESTART IDENTITY CASCADE;

-- 3. Reset Quiz/Teaser Status
-- This ensures the user sees the "Teaser" or "Quiz" intro flow again
TRUNCATE TABLE quiz_results RESTART IDENTITY CASCADE;

-- NOTE: Wishes and Coupons are NOT cleared by default. 
-- If you want to clear them too, uncomment the lines below:
-- TRUNCATE TABLE wishes RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE coupons RESTART IDENTITY CASCADE;
