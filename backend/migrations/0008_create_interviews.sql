-- Migration: Create interviews table
-- Description: Interviews table for tracking scheduled interviews between students and companies

-- Create ENUM types for interview mode and status
CREATE TYPE interview_mode AS ENUM ('online', 'offline');
CREATE TYPE interview_status AS ENUM ('scheduled', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    mode interview_mode NOT NULL DEFAULT 'online',
    status interview_status NOT NULL DEFAULT 'scheduled',
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure scheduled_at is in the future (at creation time)
    CONSTRAINT check_scheduled_at_future CHECK (scheduled_at > CURRENT_TIMESTAMP)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_company_id ON interviews(company_id);
CREATE INDEX IF NOT EXISTS idx_interviews_student_id ON interviews(student_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON interviews(created_at);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_interviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_interviews_updated_at
    BEFORE UPDATE ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_interviews_updated_at();

-- Add comments for documentation
COMMENT ON TABLE interviews IS 'Tracks interviews scheduled between students and companies';
COMMENT ON COLUMN interviews.id IS 'Unique identifier for the interview record';
COMMENT ON COLUMN interviews.application_id IS 'Reference to the job application that led to this interview';
COMMENT ON COLUMN interviews.company_id IS 'Reference to the company conducting the interview';
COMMENT ON COLUMN interviews.student_id IS 'Reference to the student being interviewed';
COMMENT ON COLUMN interviews.scheduled_at IS 'Date and time when the interview is scheduled';
COMMENT ON COLUMN interviews.mode IS 'Interview mode: online or offline';
COMMENT ON COLUMN interviews.status IS 'Current status of the interview';
COMMENT ON COLUMN interviews.feedback IS 'Interview feedback (optional)';
