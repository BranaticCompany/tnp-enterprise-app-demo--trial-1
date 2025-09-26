-- Migration: Add skills field to jobs table
-- Description: Add skills JSONB column to store required skills for each job

-- Add skills field (required skills as JSON array, nullable)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills JSONB;

-- Add comment for clarity
COMMENT ON COLUMN jobs.skills IS 'Required skills for this job stored as JSON array (e.g., ["Java", "React", "Django"])';

-- Create index for better query performance on skills
CREATE INDEX IF NOT EXISTS idx_jobs_skills ON jobs USING GIN(skills);

-- Add constraint to ensure skills is either NULL or a valid JSON array
-- Drop constraint if exists first, then recreate
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS chk_skills_format;
ALTER TABLE jobs ADD CONSTRAINT chk_skills_format 
    CHECK (skills IS NULL OR (skills::text != 'null' AND jsonb_typeof(skills) = 'array'));
