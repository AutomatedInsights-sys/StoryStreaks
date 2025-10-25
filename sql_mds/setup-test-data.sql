-- 🧪 StoryStreaks Phase 2 Test Data Setup
-- Run this in your Supabase SQL Editor to create test data

-- Clean up existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM chore_completions WHERE id LIKE 'test-%';
-- DELETE FROM chores WHERE id LIKE 'test-%';
-- DELETE FROM children WHERE id LIKE 'test-%';
-- DELETE FROM profiles WHERE id LIKE 'test-%';

-- Create test parent profile
INSERT INTO profiles (id, email, name, role, created_at, updated_at)
VALUES (
  'test-parent-123', 
  'parent@storystreaks.test', 
  'Test Parent', 
  'parent', 
  NOW(), 
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create test children
INSERT INTO children (id, name, age, age_bracket, world_theme, parent_id, current_streak, total_points, created_at, updated_at)
VALUES 
  ('test-child-123', 'Emma', 8, '7-8', 'magical_forest', 'test-parent-123', 3, 25, NOW(), NOW()),
  ('test-child-456', 'Alex', 6, '4-6', 'space_adventure', 'test-parent-123', 1, 12, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test chores
INSERT INTO chores (id, title, description, points, recurrence, assigned_to, parent_id, created_at, updated_at)
VALUES 
  ('test-chore-1', 'Clean Your Room', 'Put away toys, make your bed, and organize your desk', 5, 'daily', ARRAY['test-child-123', 'test-child-456'], 'test-parent-123', NOW(), NOW()),
  ('test-chore-2', 'Set the Table', 'Put plates, cups, and silverware on the table for dinner', 3, 'daily', ARRAY['test-child-123'], 'test-parent-123', NOW(), NOW()),
  ('test-chore-3', 'Feed the Pet', 'Give food and fresh water to the family pet', 4, 'daily', ARRAY['test-child-456'], 'test-parent-123', NOW(), NOW()),
  ('test-chore-4', 'Do Homework', 'Complete today''s math and reading assignments', 6, 'daily', ARRAY['test-child-123'], 'test-parent-123', NOW(), NOW()),
  ('test-chore-5', 'Help with Laundry', 'Sort clothes and put away clean laundry', 4, 'weekly', ARRAY['test-child-456'], 'test-parent-123', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test chore completions (some pending, some approved, some rejected)
INSERT INTO chore_completions (id, chore_id, child_id, completed_at, status, photo_url, parent_notes, created_at)
VALUES 
  -- Pending approvals
  ('test-completion-1', 'test-chore-1', 'test-child-123', NOW() - INTERVAL '1 hour', 'pending', 'https://picsum.photos/400/300?random=1', NULL, NOW() - INTERVAL '1 hour'),
  ('test-completion-2', 'test-chore-2', 'test-child-123', NOW() - INTERVAL '30 minutes', 'pending', NULL, NULL, NOW() - INTERVAL '30 minutes'),
  ('test-completion-3', 'test-chore-3', 'test-child-456', NOW() - INTERVAL '15 minutes', 'pending', 'https://picsum.photos/400/300?random=2', NULL, NOW() - INTERVAL '15 minutes'),
  
  -- Approved completions
  ('test-completion-4', 'test-chore-4', 'test-child-123', NOW() - INTERVAL '2 hours', 'approved', 'https://picsum.photos/400/300?random=3', 'Great job on your homework!', NOW() - INTERVAL '2 hours'),
  ('test-completion-5', 'test-chore-5', 'test-child-456', NOW() - INTERVAL '3 hours', 'approved', NULL, 'Perfect sorting!', NOW() - INTERVAL '3 hours'),
  
  -- Rejected completions
  ('test-completion-6', 'test-chore-1', 'test-child-456', NOW() - INTERVAL '4 hours', 'rejected', 'https://picsum.photos/400/300?random=4', 'Please try again - the room still needs more organizing.', NOW() - INTERVAL '4 hours')
ON CONFLICT (id) DO NOTHING;

-- Create test notifications
INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at)
VALUES 
  -- Parent notifications
  ('test-notification-1', 'test-parent-123', 'approval_request', 'Chore Completed', 'Emma completed "Clean Your Room" and is waiting for your approval.', '{"choreId": "test-chore-1", "childId": "test-child-123", "type": "chore_completion"}', false, NOW() - INTERVAL '1 hour'),
  ('test-notification-2', 'test-parent-123', 'approval_request', 'Chore Completed', 'Emma completed "Set the Table" and is waiting for your approval.', '{"choreId": "test-chore-2", "childId": "test-child-123", "type": "chore_completion"}', false, NOW() - INTERVAL '30 minutes'),
  
  -- Child notifications
  ('test-notification-3', 'test-child-123', 'approval_request', 'Chore Approved 🎉', 'Your chore "Do Homework" has been approved. Great job on your homework!', '{"choreId": "test-chore-4", "approved": true, "parentNotes": "Great job on your homework!", "type": "chore_approval"}', false, NOW() - INTERVAL '2 hours'),
  ('test-notification-4', 'test-child-456', 'approval_request', 'Chore Rejected 😔', 'Your chore "Clean Your Room" has been rejected. Please try again - the room still needs more organizing.', '{"choreId": "test-chore-1", "approved": false, "parentNotes": "Please try again - the room still needs more organizing.", "type": "chore_approval"}', false, NOW() - INTERVAL '4 hours')
ON CONFLICT (id) DO NOTHING;

-- Verify the data was created
SELECT 'Test data setup complete!' as status;

-- Show summary of created data
SELECT 'Profiles' as table_name, COUNT(*) as count FROM profiles WHERE id LIKE 'test-%'
UNION ALL
SELECT 'Children' as table_name, COUNT(*) as count FROM children WHERE id LIKE 'test-%'
UNION ALL
SELECT 'Chores' as table_name, COUNT(*) as count FROM chores WHERE id LIKE 'test-%'
UNION ALL
SELECT 'Chore Completions' as table_name, COUNT(*) as count FROM chore_completions WHERE id LIKE 'test-%'
UNION ALL
SELECT 'Notifications' as table_name, COUNT(*) as count FROM notifications WHERE id LIKE 'test-%';

-- Show pending approvals count
SELECT 
  'Pending Approvals' as metric,
  COUNT(*) as count
FROM chore_completions 
WHERE status = 'pending' AND id LIKE 'test-%';
