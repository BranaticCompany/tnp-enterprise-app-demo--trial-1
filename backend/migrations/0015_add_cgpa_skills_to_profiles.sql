-- Migration: Add CGPA and skills to profiles table
-- Created: 2025-09-26

-- Up migration
-- Add CGPA column (decimal with 2 decimal places, range 0.0-10.0)
ALTER TABLE profiles ADD COLUMN cgpa NUMERIC(3,2) CHECK (cgpa >= 0.0 AND cgpa <= 10.0);

-- Add skills column as JSONB array
ALTER TABLE profiles ADD COLUMN skills JSONB DEFAULT '[]'::jsonb;

-- Add constraint to ensure skills is always a valid JSON array
ALTER TABLE profiles ADD CONSTRAINT profiles_skills_is_array 
    CHECK (skills IS NULL OR jsonb_typeof(skills) = 'array');

-- Create GIN index on skills for efficient querying
CREATE INDEX idx_profiles_skills ON profiles USING GIN (skills);

-- Create index on CGPA for filtering
CREATE INDEX idx_profiles_cgpa ON profiles(cgpa);

-- Update existing profiles to have empty skills array instead of NULL
UPDATE profiles SET skills = '[]'::jsonb WHERE skills IS NULL;

-- Add some sample CGPA values to existing profiles for demo
UPDATE profiles SET cgpa = 8.5 WHERE full_name = 'John Doe';
UPDATE profiles SET cgpa = 7.8 WHERE full_name = 'Jane Smith';
UPDATE profiles SET cgpa = 9.2 WHERE full_name = 'Alice Johnson';
UPDATE profiles SET cgpa = 8.1 WHERE full_name = 'Bob Wilson';
UPDATE profiles SET cgpa = 7.5 WHERE full_name = 'Charlie Brown';
UPDATE profiles SET cgpa = 8.9 WHERE full_name = 'Diana Prince';
UPDATE profiles SET cgpa = 7.2 WHERE full_name = 'Eve Davis';
UPDATE profiles SET cgpa = 8.7 WHERE full_name = 'Frank Miller';

-- Add some sample skills to existing profiles for demo
UPDATE profiles SET skills = '["JavaScript", "React", "Node.js", "Python"]'::jsonb WHERE full_name = 'John Doe';
UPDATE profiles SET skills = '["Java", "Spring Boot", "MySQL", "REST APIs"]'::jsonb WHERE full_name = 'Jane Smith';
UPDATE profiles SET skills = '["Python", "Machine Learning", "TensorFlow", "Data Analysis"]'::jsonb WHERE full_name = 'Alice Johnson';
UPDATE profiles SET skills = '["C++", "Data Structures", "Algorithms", "Problem Solving"]'::jsonb WHERE full_name = 'Bob Wilson';
UPDATE profiles SET skills = '["HTML", "CSS", "JavaScript", "Bootstrap"]'::jsonb WHERE full_name = 'Charlie Brown';
UPDATE profiles SET skills = '["Angular", "TypeScript", "MongoDB", "Express"]'::jsonb WHERE full_name = 'Diana Prince';
UPDATE profiles SET skills = '["React Native", "Flutter", "Mobile Development"]'::jsonb WHERE full_name = 'Eve Davis';
UPDATE profiles SET skills = '["DevOps", "Docker", "Kubernetes", "AWS"]'::jsonb WHERE full_name = 'Frank Miller';
