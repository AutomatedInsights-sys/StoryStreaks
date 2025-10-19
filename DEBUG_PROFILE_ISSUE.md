# 🔍 Debug Profile Loading Issue

## The Problem

Your authentication is working (user created successfully), but the profile loading is failing with:
- `406 (Not Acceptable)` error
- `Cannot coerce the result to a single JSON object`
- `The result contains 0 rows`

This means the database trigger didn't create the profile, or there's an issue with the profile query.

## Step-by-Step Debugging

### Step 1: Check Database Trigger Status

Run this in Supabase SQL Editor:

```sql
-- Check if trigger exists and is active
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Expected:** Should return 1 row showing the trigger exists.

### Step 2: Check Function Status

```sql
-- Check if function exists
SELECT 
  proname,
  prosecdef,
  proargnames
FROM pg_proc
WHERE proname = 'handle_new_user';
```

**Expected:** Should return 1 row with `prosecdef = true`.

### Step 3: Check Recent Users and Profiles

```sql
-- Check recent users
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Check if profiles exist for recent users
SELECT 
  p.id,
  p.email,
  p.name,
  p.role,
  p.created_at,
  au.created_at as user_created_at
FROM profiles p
JOIN auth.users au ON au.id = p.id
ORDER BY p.created_at DESC
LIMIT 5;

-- Check for users without profiles
SELECT 
  au.id,
  au.email,
  au.created_at as user_created_at,
  p.id as profile_id
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC
LIMIT 5;
```

### Step 4: Check RLS Status

```sql
-- Check if RLS is enabled on profiles table
SELECT 
  tablename,
  rowsecurity,
  hasrls
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Check RLS policies on profiles table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';
```

## Quick Fixes

### Fix 1: Manual Profile Creation

If the trigger isn't working, run this to create profiles for existing users:

```sql
-- Create profiles for users who don't have them
INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'User'),
  'parent',
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;
```

### Fix 2: Re-create Trigger

If the trigger doesn't exist, run this:

```sql
-- Re-create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    'parent',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Fix 3: Update AuthContext (Already Done)

I've updated your `AuthContext.tsx` to:
- Wait longer for the trigger (2 seconds instead of 1)
- Try manual profile creation if the trigger fails
- Return proper error messages

## Testing the Fix

### Test 1: Check Current State
1. Run the debug queries above
2. See if your test user has a profile
3. If not, run the manual profile creation

### Test 2: Test New Signup
1. Try signing up with a new email
2. Check console logs for:
   - "User created successfully!"
   - "Profile will be auto-created by database trigger"
   - "Profile loaded: { profile: {...}, profileError: null }"
   - "Auth successful!"

### Test 3: Verify Profile Creation
After signup, run this query:
```sql
SELECT * FROM profiles WHERE email = 'your-test-email@example.com';
```

Should return 1 row with the profile data.

## Common Issues and Solutions

### Issue: Trigger doesn't exist
**Solution:** Run the trigger creation SQL from Fix 2 above.

### Issue: Trigger exists but doesn't fire
**Solution:** 
1. Check if RLS is blocking the trigger
2. Try disabling RLS temporarily: `ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;`
3. Test signup
4. Re-enable RLS: `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`

### Issue: Profile exists but can't be queried
**Solution:** Check RLS policies are correct:
```sql
-- Should allow users to view their own profile
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'SELECT';
```

### Issue: Still getting 406 errors
**Solution:** Check if the profiles table structure is correct:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
```

## Expected Console Output (After Fix)

```
🔐 Starting authentication...
📤 Calling auth function...
🔐 AuthContext: User created successfully!
🔐 AuthContext: Profile will be auto-created by database trigger
🔐 AuthContext: Loading profile for user: [user-id]
🔐 AuthContext: Profile loaded: { profile: {...}, profileError: null }
📥 Auth response: { error: null }
✅ Auth successful!
```

## Next Steps

1. **Run the debug queries** to identify the issue
2. **Apply the appropriate fix** based on what you find
3. **Test signup again** with a new email
4. **Check console logs** for success messages
5. **Verify profile exists** in database

## Files to Use

- **Debug queries:** `debug_trigger.sql`
- **Manual fix:** `manual_profile_fix.sql`
- **Updated code:** `src/contexts/AuthContext.tsx` (already updated)

---

**The key is to identify whether the trigger is working or not, then apply the appropriate fix!** 🔧


