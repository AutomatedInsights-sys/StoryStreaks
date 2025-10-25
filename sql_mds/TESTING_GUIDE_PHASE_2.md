# 🧪 Testing Guide - Phase 2 Chore Approval System

## 🚀 Quick Start Testing

### Prerequisites
1. **Supabase Setup**: Ensure Services are running with the correct URL and API key
2. **Database Schema**: All tables must be created (run the SQL from README.md if needed)
3. **Dependencies**: All packages are installed (`npm install` or `yarn install`)

### Test Environment Setup

#### 1. Create Test Data
Run these SQL commands in your Supabase SQL editor to create test data:

```sql
-- Create test parent profile (replace with your actual user ID)
INSERT INTO profiles (id, email, name, role, created_at, updated_at)
VALUES ('test-parent-id', 'parent@test.com', 'Test Parent', 'parent', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test child
INSERT INTO children (id, name, age, age_bracket, world_theme, parent_id, current_streak, total_points, created_at, updated_at)
VALUES ('test-child-id', 'Test Child', 8, '7-8', 'magical_forest', 'test-parent-id', 3, 25, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test chores
INSERT INTO chores (id, title, description, points, recurrence, assigned_to, parent_id, created_at, updated_at)
VALUES 
  ('test-chore-1', 'Clean Your Room', 'Put away toys and make your bed', 5, 'daily', ARRAY['test-child-id'], 'test-parent-id', NOW(), NOW()),
  ('test-chore-2', 'Set the Table', 'Put plates, cups, and silverware on the table', 3, 'daily', ARRAY['test-child-id'], 'test-parent-id', NOW(), NOW()),
  ('test-chore-3', 'Feed the Pet', 'Give food and water to the family pet', 4, 'daily', ARRAY['test-child-id'], 'test-parent-id', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test chore completion (pending approval)
INSERT INTO chore_completions (id, chore_id, child_id, completed_at, status, photo_url, parent_notes, created_at)
VALUES 
  ('test-completion-1', 'test-chore-1', 'test-child-id', NOW(), 'pending', 'https://example.com/photo1.jpg', NULL, NOW()),
  ('test-completion-2', 'test-chore-2', 'test-child-id', NOW(), 'pending', NULL, NULL, NOW())
ON CONFLICT (id) DO NOTHING;
```

## 📱 Manual Testing Scenarios

### Scenario 1: Parent Approval Workflow

#### Step 1: Access Parent Interface
1. **Login as Parent**: Use your parent account credentials
2. **Navigate to Home**: You should see the parent home screen
3. **Check Badge**: Look for the red badge on "Review Chores" button showing pending count
4. **Tap "Review Chores"**: Navigate to ChoreApprovalScreen

#### Step 2: Review Pending Chores
1. **View Pending List**: Should see test chores waiting for approval
2. **Tap a Chore**: Opens detail modal with:
   - Chore title and description
   - Child name who completed it
   - Points value
   - Completion date
   - Photo (if uploaded)
   - Notes input field

#### Step 3: Approve/Reject Chore
1. **Add Notes** (optional): Type feedback in the notes field
2. **Tap "Approve"**: Should show success message
3. **Verify Points**: Check if child's total points increased
4. **Check Badge**: Badge count should decrease

#### Step 4: Test Rejection
1. **Find Another Pending Chore**: Repeat the process
2. **Add Rejection Notes**: Explain why it was rejected
3. **Tap "Reject"**: Should show success message
4. **Verify No Points**: Child's points should remain unchanged

### Scenario 2: Child Chore Completion

#### Step 1: Access Child Interface
1. **Login as Child**: Switch to child account or use child profile
2. **Navigate to Home**: Should see assigned chores
3. **Check Stats**: Verify current streak and total points display

#### Step 2: Complete a Chore
1. **Tap a Chore Card**: Navigate to ChoreDetailScreen
2. **Review Details**: Check chore title, description, points, and type
3. **Add Photo** (optional):
   - Tap "📷 Add Photo"
   - Choose "Camera" or "Photo Library"
   - Take/select a photo
   - Verify photo preview appears

#### Step 3: Submit for Approval
1. **Tap "Mark as Complete"**: Should show loading indicator
2. **Wait for Success**: Should see "Chore Completed! 🎉" message
3. **Navigate Back**: Should return to child home screen

#### Step 4: Verify Submission
1. **Switch to Parent Account**: Login as parent
2. **Check Badge**: Should see increased pending count
3. **Review Chores**: New completion should appear in pending list

### Scenario 3: Photo Upload Testing

#### Test Camera Integration
1. **Open Chore Detail**: Navigate to any chore
2. **Tap "📷 Add Photo"**: Choose "Camera"
3. **Grant Permission**: Allow camera access when prompted
4. **Take Photo**: Capture a test image
5. **Edit Photo**: Use the built-in cropping tool
6. **Complete Chore**: Submit with photo

#### Test Photo Library
1. **Repeat Process**: But choose "Photo Library"
2. **Select Existing Photo**: Pick from device gallery
3. **Edit if Needed**: Crop or adjust the image
4. **Complete Chore**: Submit with selected photo

#### Verify Photo Display
1. **Switch to Parent**: Login as parent
2. **Review Chores**: Find the chore with photo
3. **Open Detail Modal**: Should see the uploaded photo
4. **Check Quality**: Verify photo displays correctly

### Scenario 4: Notification System

#### Test Parent Notifications
1. **Complete Chore as Child**: Submit a chore for approval
2. **Check Database**: Verify notification was created
3. **Switch to Parent**: Login as parent account
4. **Check Badge**: Should see updated pending count

#### Test Child Notifications
1. **Approve/Reject Chore**: As parent, make a decision
2. **Check Database**: Verify notification was sent to child
3. **Switch to Child**: Login as child account
4. **Check for Updates**: Should see feedback notification

## 🔧 Technical Testing

### Database Testing

#### Verify Data Integrity
```sql
-- Check chore completions
SELECT 
  cc.id,
  c.title as chore_title,
  ch.name as child_name,
  cc.status,
  cc.photo_url,
  cc.parent_notes,
  cc.completed_at
FROM chore_completions cc
JOIN chores c ON cc.chore_id = c.id
JOIN children ch ON cc.child_id = ch.id
ORDER BY cc.completed_at DESC;

-- Check notifications
SELECT 
  n.id,
  n.type,
  n.title,
  n.message,
  n.is_read,
  n.created_at
FROM notifications n
ORDER BY n.created_at DESC;

-- Check child points
SELECT 
  name,
  current_streak,
  total_points
FROM children
WHERE parent_id = 'your-parent-id';
```

#### Test Photo Storage
```sql
-- Check if photos are being stored
SELECT 
  cc.id,
  c.title,
  cc.photo_url,
  cc.created_at
FROM chore_completions cc
JOIN chores c ON cc.chore_id = c.id
WHERE cc.photo_url IS NOT NULL;
```

### Error Handling Testing

#### Test Network Issues
1. **Disconnect Internet**: Turn off WiFi/mobile data
2. **Try to Complete Chore**: Should show appropriate error
3. **Reconnect**: Should allow retry

#### Test Permission Issues
1. **Deny Camera Permission**: When prompted for camera access
2. **Try Photo Upload**: Should show permission error
3. **Grant Permission**: Should work normally

#### Test Invalid Data
1. **Try to Approve Non-existent Chore**: Should handle gracefully
2. **Submit Chore Without Child**: Should show error
3. **Upload Invalid File**: Should handle file type errors

## 🐛 Common Issues & Solutions

### Issue: Badge Not Updating
**Solution**: Check if `fetchPendingApprovalsCount()` is being called in `useEffect` and on refresh

### Issue: Photos Not Uploading
**Solution**: Verify Supabase storage bucket exists and has proper permissions

### Issue: Notifications Not Appearing
**Solution**: Check if notification service is properly integrated and database has correct user IDs

### Issue: Points Not Updating
**Solution**: Verify the points update query in `handleApprove` function

### Issue: Chores Not Appearing for Child
**Solution**: Check if child ID is correctly assigned in chores and matches current child

## 📊 Performance Testing

### Load Testing
1. **Create Multiple Chores**: Add 10+ chores for a child
2. **Complete All Chores**: Submit all for approval
3. **Check Performance**: Verify smooth scrolling and loading

### Memory Testing
1. **Upload Large Photos**: Test with high-resolution images
2. **Navigate Between Screens**: Check for memory leaks
3. **Long Session**: Use app for extended period

## ✅ Success Criteria

### Functional Requirements
- [ ] Parent can view pending chore approvals
- [ ] Parent can approve/reject chores with notes
- [ ] Child can complete chores with photo upload
- [ ] Points are correctly awarded on approval
- [ ] Notifications are sent and received
- [ ] Badge updates show pending count

### Non-Functional Requirements
- [ ] App loads within 3 seconds
- [ ] Photo upload completes within 10 seconds
- [ ] Smooth scrolling and navigation
- [ ] Proper error handling and user feedback
- [ ] Works on both iOS and Android
- [ ] Handles network connectivity issues

## 🚀 Next Steps After Testing

Once testing is complete and all scenarios pass:

1. **Fix Any Issues**: Address bugs or performance problems
2. **Optimize Performance**: Improve slow queries or UI lag
3. **Add Edge Cases**: Handle additional error scenarios
4. **Prepare for Phase 3**: AI Story Generation implementation
5. **Document Findings**: Record any issues or improvements needed

## 📞 Support

If you encounter issues during testing:
1. Check the console logs for error messages
2. Verify database connections and permissions
3. Ensure all environment variables are set correctly
4. Check Supabase dashboard for any service issues

Happy Testing! 🎉
