-- Migration: Create placements table
-- This table tracks final placement records when students are placed in jobs

-- Create ENUM type for placement status
CREATE TYPE placement_status AS ENUM ('offered', 'accepted', 'joined', 'declined');

-- Create placements table
CREATE TABLE placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    package DECIMAL(12, 2), -- Salary package (can be null if not disclosed)
    role TEXT NOT NULL, -- Position/role offered
    status placement_status NOT NULL DEFAULT 'offered',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one placement per student-job combination
    UNIQUE(student_id, job_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_placements_student_id ON placements(student_id);
CREATE INDEX idx_placements_job_id ON placements(job_id);
CREATE INDEX idx_placements_company_id ON placements(company_id);
CREATE INDEX idx_placements_status ON placements(status);
CREATE INDEX idx_placements_created_at ON placements(created_at);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_placements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_placements_updated_at
    BEFORE UPDATE ON placements
    FOR EACH ROW
    EXECUTE FUNCTION update_placements_updated_at();

-- Add comments for documentation
COMMENT ON TABLE placements IS 'Tracks final placement records when students are placed in jobs';
COMMENT ON COLUMN placements.id IS 'Unique identifier for the placement record';
COMMENT ON COLUMN placements.student_id IS 'Reference to the student who got placed';
COMMENT ON COLUMN placements.job_id IS 'Reference to the job for which student was placed';
COMMENT ON COLUMN placements.company_id IS 'Reference to the company (must match job company)';
COMMENT ON COLUMN placements.package IS 'Salary package offered (in currency units)';
COMMENT ON COLUMN placements.role IS 'Position/role title offered to the student';
COMMENT ON COLUMN placements.status IS 'Current status of the placement offer';
