-- Migration: Add package and type fields to jobs table
-- Description: Add salary package and job type fields to jobs table

-- Add package field (salary in rupees, can be null for "Not specified")
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS package BIGINT;

-- Add type field (Full Time, Internship, etc.)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'Full Time';

-- Add comment for clarity
COMMENT ON COLUMN jobs.package IS 'Salary package in rupees per annum, null means not specified';
COMMENT ON COLUMN jobs.type IS 'Job type: Full Time, Internship, Part Time, etc.';

-- Create index for job type filtering
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
