-- Migration: Add created_by field to jobs table
-- Description: Add created_by field to track which recruiter created the job

-- Add created_by field (references users table for recruiter)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);

-- Add comment for clarity
COMMENT ON COLUMN jobs.created_by IS 'ID of the recruiter who created this job';

-- Update existing jobs to have a default created_by (optional - can be left NULL for existing jobs)
-- This is safe because we're adding it as nullable and existing jobs will work fine
