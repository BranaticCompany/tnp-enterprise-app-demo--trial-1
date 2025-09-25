-- Migration: Fix company_id constraint issue
-- Description: Make company_id nullable since we're using company_name instead

-- Make company_id nullable (remove NOT NULL constraint)
ALTER TABLE jobs ALTER COLUMN company_id DROP NOT NULL;

-- Add comment to clarify the change
COMMENT ON COLUMN jobs.company_id IS 'Legacy company_id field, nullable since we use company_name instead';
