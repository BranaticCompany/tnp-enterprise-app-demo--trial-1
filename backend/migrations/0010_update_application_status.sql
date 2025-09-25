-- Migration: Update application status workflow
-- Description: Extend application status enum to support comprehensive workflow

-- Add new status values to the application_status enum
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'round1_qualified';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'round2_qualified';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'offered';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'placed';

-- Note: PostgreSQL doesn't allow removing enum values easily, so we keep existing ones
-- Current enum values: 'applied', 'reviewed', 'shortlisted', 'rejected', 'hired'
-- New enum values: 'round1_qualified', 'round2_qualified', 'offered', 'placed'
-- Complete workflow: applied -> reviewed -> round1_qualified -> round2_qualified -> shortlisted -> offered -> placed
