-- Migration: Add resume_url column to profiles table
-- This allows students to upload and store resume files

-- Add resume_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN resume_url VARCHAR(500);

-- Add comment for documentation
COMMENT ON COLUMN profiles.resume_url IS 'Path to uploaded resume file (PDF only, max 5MB)';

-- Create index for efficient queries when filtering by resume availability
CREATE INDEX idx_profiles_resume_url ON profiles(resume_url) WHERE resume_url IS NOT NULL;

-- Update updated_at timestamp for profiles table
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at_trigger') THEN
        CREATE TRIGGER update_profiles_updated_at_trigger
            BEFORE UPDATE ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_profiles_updated_at();
    END IF;
END $$;
