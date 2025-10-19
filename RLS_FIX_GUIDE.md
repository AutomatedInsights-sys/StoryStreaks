# 🔧 StoryStreaks RLS Authentication Fix Guide

## The Problem

When users tried to sign up, they encountered this error:
```
Auth error: new row violates row-level security policy for table 'profiles'
```

This happened because:
1. `supabase.auth.signUp()` creates a user in `auth.users`
2. The app tried to manually insert a profile in the `profiles` table
3. RLS policies blocked the insert because `auth.uid()` wasn't immediately available for the new session

## The Solution

Instead of manually creating profiles from the client, we use a **database trigger** that automatically creates profiles when users sign up. This trigger runs with elevated privileges (SECURITY DEFINER) and bypasses RLS entirely.

### Benefits:
✅ More secure - profile creation happens server-side
✅ More reliable - no race conditions with session establishment
✅ Cleaner code - no manual profile management in the app
✅ Best practice - follows Supabase recommended patterns

## Implementation Steps

### Step 1: Apply the SQL Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy the entire contents of `supabase_rls_fix.sql`
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

**What this does:**
- Creates a `handle_new_user()` function that auto-creates profiles
- Sets up a trigger `on_auth_user_created` that fires when users sign up
- Updates all RLS policies to be more secure and performant
- Removes the need for manual profile creation

### Step 2: Verify the Migration

Run these verification queries in the SQL Editor:

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

-- List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Step 3: Test the Fix

1. Make sure your app is connected to Supabase (check `.env` file)
2. Try signing up with a new account
3. The profile should be created automatically
4. You should be logged in without errors

### Step 4: Clean Up Old Data (Optional)

If you have test users without profiles from previous signup attempts:

```sql
-- Find users without profiles
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Manually create profiles for existing users (if needed)
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

## How It Works Now

### Old Flow (Broken):
```
1. User fills signup form
2. supabase.auth.signUp() creates auth.users record
3. App tries to insert into profiles table ❌
4. RLS blocks because auth.uid() not available yet
5. Error shown to user
```

### New Flow (Fixed):
```
1. User fills signup form
2. supabase.auth.signUp() creates auth.users record
3. Database trigger automatically creates profile ✅
4. App loads the profile
5. User is successfully logged in
```

## Code Changes Made

### 1. Created SQL Migration (`supabase_rls_fix.sql`)
- Database trigger for auto-creating profiles
- Comprehensive RLS policies for all tables
- Secure access patterns

### 2. Updated `src/contexts/AuthContext.tsx`
- Removed manual profile creation code
- Added 1-second delay to allow trigger to complete
- Simplified signup flow
- Better error handling

## Testing Checklist

- [ ] SQL migration applied successfully
- [ ] Trigger and function exist in database
- [ ] Sign up with new email works
- [ ] Profile is created automatically
- [ ] User is logged in after signup
- [ ] Can create child profiles
- [ ] Can create chores
- [ ] RLS is still enabled and working

## Troubleshooting

### Issue: "Function handle_new_user() does not exist"
**Solution:** Make sure you ran the entire SQL migration file, not just parts of it.

### Issue: "Profile not found after signup"
**Solution:** The trigger might not have fired. Check:
```sql
SELECT * FROM profiles WHERE id = 'YOUR_USER_ID';
```

### Issue: "Still getting RLS errors"
**Solution:** Make sure RLS is enabled on all tables:
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
```

### Issue: "Trigger not firing"
**Solution:** Verify the trigger is active:
```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

## Additional Security Notes

The RLS policies ensure:
- Users can only view and update their own profile
- Parents can only manage their own children's data
- All chores, rewards, and story segments are scoped to the parent's children
- No user can access another user's data

## Next Steps

After fixing the RLS issue, you can:
1. ✅ Test the complete signup/signin flow
2. ✅ Create child profiles
3. ✅ Add chores and track completions
4. ✅ Generate AI stories for completed chores
5. ✅ Deploy to production with confidence

## Support

If you encounter any issues:
1. Check the Supabase dashboard logs
2. Review the SQL Editor for query errors
3. Check browser console for client-side errors
4. Verify your `.env` file has correct credentials

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)



