# 🧪 StoryStreaks RLS Fix - Testing Checklist

## Pre-Flight Checks

- [ ] `.env` file exists with correct Supabase credentials
- [ ] SQL migration (`supabase_rls_fix.sql`) has been applied
- [ ] Database trigger is active
- [ ] RLS is enabled on all tables

## Test Scenarios

### 1. New User Signup ✨

**Steps:**
1. Open the app
2. Click "Don't have an account? Sign Up"
3. Fill in:
   - Full Name: "Test Parent"
   - Email: "testparent@example.com"
   - Password: "TestPassword123!"
4. Click "Sign Up"

**Expected Result:**
- ✅ No RLS error appears
- ✅ Success alert shown: "Welcome to StoryStreaks!"
- ✅ User is logged in
- ✅ Navigated to Parent Home Screen
- ✅ Profile created in database

**Verify in Database:**
```sql
SELECT * FROM profiles WHERE email = 'testparent@example.com';
-- Should show: id, email, name='Test Parent', role='parent'
```

### 2. User Sign In 🔐

**Steps:**
1. Sign out if logged in
2. Click "Sign In"
3. Enter credentials from test scenario 1
4. Click "Sign In"

**Expected Result:**
- ✅ Successfully logs in
- ✅ Profile loads correctly
- ✅ Navigated to Parent Home Screen

### 3. Create Child Profile 👶

**Steps:**
1. Sign in as parent
2. Navigate to "Child Profiles"
3. Click "Add Child"
4. Fill in:
   - Name: "Emma"
   - Age: 7
   - Theme: "Enchanted Forest"
5. Save

**Expected Result:**
- ✅ Child profile created
- ✅ No RLS errors
- ✅ Child appears in list

**Verify in Database:**
```sql
SELECT * FROM children WHERE name = 'Emma';
-- Should show child with correct parent_id
```

### 4. Create Chore 📝

**Steps:**
1. Sign in as parent with a child created
2. Navigate to "Chore Management"
3. Click "Create Chore"
4. Fill in:
   - Title: "Clean Room"
   - Description: "Tidy up bedroom"
   - Points: 10
   - Assign to: Emma
5. Save

**Expected Result:**
- ✅ Chore created successfully
- ✅ No RLS errors
- ✅ Chore appears in list

**Verify in Database:**
```sql
SELECT c.*, ch.name as child_name
FROM chores c
JOIN children ch ON ch.id = c.child_id
WHERE c.title = 'Clean Room';
```

### 5. Complete Chore & Generate Story 📚

**Steps:**
1. Mark chore as complete
2. Approve completion
3. Trigger story generation

**Expected Result:**
- ✅ Chore completion recorded
- ✅ Story segment created
- ✅ No RLS errors

### 6. Security Test - Cross-User Access 🔒

**Steps:**
1. Create two different parent accounts
2. Parent A creates a child
3. Try to access Parent A's data while logged in as Parent B

**Expected Result:**
- ✅ Parent B cannot see Parent A's children
- ✅ Parent B cannot see Parent A's chores
- ✅ RLS properly blocks unauthorized access

**Test Query (should return nothing when logged in as Parent B):**
```sql
-- Run as Parent B, should not see Parent A's data
SELECT * FROM children WHERE parent_id != auth.uid();
```

## Database Verification Queries

### Check Trigger Status
```sql
-- Verify trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

### Check RLS Status
```sql
-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'children', 'chores', 'chore_completions', 'story_segments', 'rewards');
```

### Check RLS Policies
```sql
-- List all active policies
SELECT 
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check User-Profile Relationships
```sql
-- Verify all users have profiles
SELECT 
  au.id,
  au.email,
  au.created_at as user_created,
  p.id as profile_id,
  p.created_at as profile_created,
  CASE 
    WHEN p.id IS NULL THEN '❌ Missing'
    ELSE '✅ Exists'
  END as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC;
```

## Common Issues & Solutions

### Issue: Profile not created after signup

**Debug:**
```sql
-- Check if user exists in auth.users
SELECT id, email, created_at FROM auth.users WHERE email = 'your-email@example.com';

-- Check if trigger fired
SELECT * FROM profiles WHERE email = 'your-email@example.com';
```

**Solution:**
- Manually trigger profile creation for existing users
- Verify trigger is active
- Check Supabase logs for errors

### Issue: RLS still blocking operations

**Debug:**
```sql
-- Check which policies are active
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Test auth.uid() is working
SELECT auth.uid();
```

**Solution:**
- Re-run the SQL migration
- Ensure RLS is enabled but policies allow the operation
- Check session is properly established

### Issue: Timeout waiting for profile

**Debug:**
- Check Supabase dashboard logs
- Look for trigger execution errors
- Verify network connectivity

**Solution:**
- Increase timeout in `AuthContext.tsx` (currently 1000ms)
- Check database performance
- Verify trigger function has no errors

## Performance Checks

### Trigger Performance
```sql
-- Check how long profiles take to create
SELECT 
  au.created_at as user_created,
  p.created_at as profile_created,
  p.created_at - au.created_at as creation_delay
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC
LIMIT 10;
```

**Expected:** Profile creation should be < 100ms

### Query Performance
```sql
-- Check if policies are efficient
EXPLAIN ANALYZE
SELECT * FROM children WHERE parent_id = 'some-uuid';
```

**Expected:** Should use index, execution time < 10ms

## Sign-Off

Once all tests pass:
- [ ] All test scenarios completed successfully
- [ ] No RLS errors in any flow
- [ ] Database queries verified
- [ ] Security tests passed
- [ ] Performance is acceptable

## Next Steps After Testing

1. ✅ Commit the changes to git
2. ✅ Test on a real device (not just emulator)
3. ✅ Deploy to production
4. ✅ Monitor Supabase logs for any issues
5. ✅ Set up error tracking (Sentry, etc.)

## Emergency Rollback

If something goes wrong:

```sql
-- Remove the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Disable RLS temporarily (NOT RECOMMENDED FOR PRODUCTION)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

Then investigate the issue and reapply the fix.

---

**Remember:** Always test in a development environment before applying to production!



