-- Add category column to site_guide table
ALTER TABLE site_guide 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'عام';

-- Update existing records to have 'عام' as category if null
UPDATE site_guide SET category = 'عام' WHERE category IS NULL;
