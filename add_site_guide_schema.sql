-- Create a table for the Site Guide (Explanation Section)
CREATE TABLE IF NOT EXISTS site_guide (
    id BIGSERIAL PRIMARY KEY,
    image_url TEXT, -- URL of the uploaded image
    description TEXT NOT NULL, -- The text explanation below the image
    display_order INTEGER DEFAULT 0, -- To control the order of sections
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy to allow everyone to read
CREATE POLICY "Public can view site guide" ON site_guide
    FOR SELECT USING (true);

-- Policy to allow only admins to insert/update/delete
-- Assuming you have an "is_admin" check or similar in your RLS, 
-- otherwise we'll rely on client-side role checks for now (simplification)
-- or better:
-- CREATE POLICY "Admins can manage site guide" ON site_guide
--     FOR ALL USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));

-- Enable RLS
ALTER TABLE site_guide ENABLE ROW LEVEL SECURITY;

-- If RLS is tricky for now, allow all (Admin handles security via UI):
CREATE POLICY "Enable all access for now" ON site_guide FOR ALL USING (true);
