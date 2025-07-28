-- Enhanced Authentication Schema Migration
-- This file contains the new tables and modifications needed for advanced authentication

-- 1. Enhanced Users table (profiles table from Supabase)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'business_specialist',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    force_password_change BOOLEAN DEFAULT FALSE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- 2. User Audit Log table for tracking authentication events
CREATE TABLE IF NOT EXISTS user_audit_log (
    id SERIAL PRIMARY KEY,
    admin_id UUID REFERENCES profiles(id),
    target_user_id UUID REFERENCES profiles(id),
    action VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. JWT Tokens table for session management
CREATE TABLE IF NOT EXISTS jwt_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Password Reset Tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Update existing users table to work with new system
-- We'll keep the existing users table for backward compatibility
-- but add a reference to the new profiles table

-- Add UUID column to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_target_user ON user_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_jwt_tokens_user_id ON jwt_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_jwt_tokens_expires_at ON jwt_tokens(expires_at);

-- Insert default admin user
INSERT INTO profiles (id, full_name, email, role, status) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Admin User', 'admin@telecom.com', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- Update existing users to reference the new profile
UPDATE users SET profile_id = '550e8400-e29b-41d4-a716-446655440000' WHERE email = 'john.doe@company.com';
