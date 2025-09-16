-- Migration: Create users table
-- Created: 2025-09-17

-- Up migration
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT FALSE
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Create index on role for filtering
CREATE INDEX idx_users_role ON users(role);
