-- Fix RLS policies for story notifications
-- This script fixes the notification creation issues

-- Enable RLS on notifications table (if not already enabled)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Create new policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own notifications" ON notifications 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications 
FOR UPDATE USING (user_id = auth.uid());

-- Allow service role to create notifications for children
-- This is needed for the AI story service to create notifications
CREATE POLICY "Service can create notifications for children" ON notifications 
FOR INSERT WITH CHECK (
  user_id IN (
    SELECT id FROM children WHERE parent_id = auth.uid()
  )
);

-- Fix story_progress table constraints
-- Drop and recreate the unique constraint to handle updates properly
ALTER TABLE story_progress DROP CONSTRAINT IF EXISTS story_progress_child_id_world_theme_key;

-- Create a new unique constraint that allows updates
ALTER TABLE story_progress ADD CONSTRAINT story_progress_child_id_world_theme_key 
UNIQUE (child_id, world_theme);

-- Ensure RLS is enabled on story_progress
ALTER TABLE story_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for story_progress
DROP POLICY IF EXISTS "Users can view own story progress" ON story_progress;
DROP POLICY IF EXISTS "Users can manage own story progress" ON story_progress;

CREATE POLICY "Users can view own story progress" ON story_progress 
FOR SELECT USING (
  child_id IN (
    SELECT id FROM children WHERE parent_id = auth.uid()
  )
);

CREATE POLICY "Users can manage own story progress" ON story_progress 
FOR ALL USING (
  child_id IN (
    SELECT id FROM children WHERE parent_id = auth.uid()
  )
);

-- Allow service role to manage story progress
CREATE POLICY "Service can manage story progress" ON story_progress 
FOR ALL USING (
  child_id IN (
    SELECT id FROM children WHERE parent_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_type ON notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_story_progress_child_theme ON story_progress(child_id, world_theme);
CREATE INDEX IF NOT EXISTS idx_story_chapters_child_theme_number ON story_chapters(child_id, world_theme, chapter_number);

-- Grant necessary permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON story_progress TO authenticated;
GRANT ALL ON story_chapters TO authenticated;
