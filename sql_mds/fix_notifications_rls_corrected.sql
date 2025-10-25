-- Fix RLS policies for notifications table
-- This will allow notifications to be created and read properly

-- First, let's check if the notifications table exists and what policies are currently set
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

-- Drop existing policies if they exist (to start fresh)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Create RLS policies for notifications
-- Allow users to view notifications where they are the recipient (using user_id column)
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Allow users to create notifications (for parent-child communication)
CREATE POLICY "Users can create notifications" ON notifications
FOR INSERT TO authenticated
WITH CHECK (
  -- Allow if user is the recipient (using user_id column)
  auth.uid() = user_id
);

-- Allow users to update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

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
