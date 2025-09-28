-- Migration: Add cgpa column to profiles table
-- This allows students to store their CGPA information

-- Add cgpa column to profiles table
ALTER TABLE profiles 
ADD COLUMN cgpa NUMERIC(3,2) CHECK (cgpa >= 0.0 AND cgpa <= 10.0);

-- Add comment for documentation
COMMENT ON COLUMN profiles.cgpa IS 'Student CGPA (0.0 to 10.0 scale)';

-- Create index for efficient queries when filtering by CGPA
CREATE INDEX idx_profiles_cgpa ON profiles(cgpa) WHERE cgpa IS NOT NULL;
