-- Migration: Add extended fields to jobs table
-- Description: Add location, requirements, cgpa_criteria, and company_name fields to jobs table

-- Add location field (job location, nullable)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Add requirements field (job requirements/eligibility, nullable but maps to existing eligibility)
-- Note: We already have eligibility field, so requirements will be an alias or we'll use eligibility

-- Add cgpa_criteria field (minimum CGPA required, required for job posting)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cgpa_criteria NUMERIC(3,2) NOT NULL DEFAULT 0.0;

-- Add company_name field (company name as text instead of foreign key)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

-- Add comments for clarity
COMMENT ON COLUMN jobs.location IS 'Job location (city, state, country)';
COMMENT ON COLUMN jobs.cgpa_criteria IS 'Minimum CGPA required for this job (0.00 to 10.00)';
COMMENT ON COLUMN jobs.company_name IS 'Company name as text field';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_cgpa_criteria ON jobs(cgpa_criteria);
CREATE INDEX IF NOT EXISTS idx_jobs_company_name ON jobs(company_name);

-- Add constraint to ensure CGPA is within valid range
ALTER TABLE jobs ADD CONSTRAINT chk_cgpa_range 
    CHECK (cgpa_criteria >= 0.0 AND cgpa_criteria <= 10.0);
