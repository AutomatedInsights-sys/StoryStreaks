-- Comprehensive fix for notifications table and RLS policies
-- This will check the table structure and fix all issues

-- First, let's check if the notifications table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if RLS is enabled on the notifications table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'notifications' 
AND schemaname = 'public';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
ORDER BY policyname;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON notifications;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON notifications;

-- Create comprehensive RLS policies for notifications
-- Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Allow users to create notifications (for parent-child communication)
CREATE POLICY "Users can create notifications" ON notifications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications' 
AND schemaname = 'public'
ORDER BY policyname;

-- Test if we can insert a notification (this should work now)
-- Note: This is just a test - don't actually run this in production
/*
INSERT INTO notifications (user_id, type, title, message, is_read)
VALUES (auth.uid()::text, 'approval_request', 'Test', 'Test message', false);
*/
