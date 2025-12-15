-- POLICY: Allow Admin (Hassanen) to view and delete ALL quiz results

-- 1. Drop existing policies if they conflict (or just Ensure these exist)
-- We'll create specific policies for Admin.

-- Admin SELECT (View All)
CREATE POLICY "Admin View All Quiz Results"
ON quiz_results
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'hassanen@love.com'
);

-- Admin DELETE
CREATE POLICY "Admin Delete Quiz Results"
ON quiz_results
FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'hassanen@love.com'
);

-- Ensure RLS is enabled
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
