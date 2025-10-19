# 🚀 Quick Start - Fix RLS Authentication Issue

## The 60-Second Fix

### Step 1: Run SQL (2 minutes)
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in sidebar
4. Click **New Query**
5. Open `supabase_rls_fix_CORRECTED.sql` in your editor ⚠️ **Use the CORRECTED version**
6. Copy **ALL** contents (Ctrl+A, Ctrl+C)
7. Paste into Supabase SQL Editor (Ctrl+V)
8. Click **Run** (or press Ctrl+Enter)
9. Wait for "Success. No rows returned" message

### Step 2: Test It (30 seconds)
1. Open your app
2. Click "Sign Up"
3. Enter email, password, name
4. Click "Sign Up"
5. ✅ Should work without errors!

### Step 3: Verify (optional, 1 minute)
Run this in SQL Editor:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```
Should return 1 row showing the trigger exists.

---

## What This Does

🔧 **Creates a database trigger** that automatically creates user profiles when someone signs up

🛡️ **Updates RLS policies** to properly secure all tables while allowing necessary operations

✨ **Fixes the error:** "new row violates row-level security policy for table 'profiles'"

---

## How to Test

### Test 1: Sign Up
- Go to sign up screen
- Enter: email, password, name
- Click Sign Up
- **Expected:** Success! No RLS error

### Test 2: Sign In
- Sign out
- Sign in with same credentials
- **Expected:** Logs in successfully

### Test 3: Create Child
- Navigate to Child Profiles
- Add a child
- **Expected:** Child created, no errors

---

## Before vs After

### ❌ Before (Broken)
```
User signs up
→ Auth user created
→ App tries to create profile
→ RLS blocks it ❌
→ Error shown to user
```

### ✅ After (Fixed)
```
User signs up
→ Auth user created
→ Database trigger creates profile automatically ✅
→ App loads profile
→ User logged in successfully
```

---

## If Something Goes Wrong

### Error: "column chores.child_id does not exist"
**Solution:** You used the wrong SQL file! Use `supabase_rls_fix_CORRECTED.sql` instead. See `SCHEMA_FIX_NOTE.md` for details.

### Error: "Function does not exist"
**Solution:** You didn't run the entire SQL file. Run it again completely.

### Error: "Profile not found"
**Solution:** Check if trigger is active:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Error: Still getting RLS errors
**Solution:** Make sure RLS is enabled:
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

---

## Need More Help?

📚 **Detailed Guide:** See `RLS_FIX_GUIDE.md`
✅ **Full Testing:** See `TESTING_CHECKLIST.md`
📝 **Summary:** See `IMPLEMENTATION_SUMMARY.md`

---

## Emergency Rollback

If you need to undo everything:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

---

## That's It!

The fix is literally just:
1. Run `supabase_rls_fix_CORRECTED.sql` in Supabase
2. Test signup

Your app should now work perfectly! 🎉

---

## ⚠️ Important Note

**Use `supabase_rls_fix_CORRECTED.sql`** - The original file had schema mismatches. If you got an error about "column chores.child_id does not exist", that's because you used the wrong file. The corrected version matches your actual database schema.

