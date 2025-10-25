-- Add PIN Security to Profiles Table
-- Run this in your Supabase SQL Editor

-- Add PIN and session tracking columns to profiles table
ALTER TABLE profiles ADD COLUMN parent_pin TEXT;
ALTER TABLE profiles ADD COLUMN pin_last_verified TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN profiles.parent_pin IS 'Hashed parent PIN for accessing parent features';
COMMENT ON COLUMN profiles.pin_last_verified IS 'Timestamp of last successful PIN verification';

-- Create index for performance (if needed)
CREATE INDEX IF NOT EXISTS idx_profiles_pin_verified ON profiles(pin_last_verified) WHERE parent_pin IS NOT NULL;
