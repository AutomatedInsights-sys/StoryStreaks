# 🔧 Schema Fix Note

## Issue Found

The original `supabase_rls_fix.sql` had incorrect column references that didn't match your actual database schema.

### What Was Wrong:
- Referenced `chores.child_id` (doesn't exist)
- Referenced `story_segments` table (doesn't exist)
- Missing policies for several tables

### Your Actual Schema:
- `chores` table has `parent_id` (not `child_id`)
- `chores.assigned_to` is an array of child IDs
- `story_chapters` and `story_progress` tables (not `story_segments`)
- Additional tables: `reward_redemptions`, `notifications`

## Solution

✅ **Use the CORRECTED file:** `supabase_rls_fix_CORRECTED.sql`

This file:
- ✅ Uses correct column names (`parent_id` for chores and rewards)
- ✅ Includes policies for `story_chapters` and `story_progress`
- ✅ Adds policies for `reward_redemptions`
- ✅ Adds policies for `notifications`
- ✅ Matches your actual database schema exactly

## How to Apply

1. **Open Supabase Dashboard** at https://app.supabase.com
2. Go to **SQL Editor**
3. Open `supabase_rls_fix_CORRECTED.sql`
4. Copy **ALL** contents
5. Paste into SQL Editor
6. Click **Run**
7. Should succeed! ✅

## What Changed

### Chores Table (Fixed)
**Before (Wrong):**
```sql
-- Referenced non-existent child_id column
WHERE children.id = chores.child_id
```

**After (Correct):**
```sql
-- Uses existing parent_id column
WHERE auth.uid() = parent_id
```

### Story Tables (Fixed)
**Before (Wrong):**
```sql
-- Referenced non-existent story_segments table
ON story_segments FOR SELECT
```

**After (Correct):**
```sql
-- Uses actual story_chapters table
ON story_chapters FOR SELECT
-- Also added story_progress policies
```

### Rewards Table (Fixed)
**Before (Wrong):**
```sql
-- Tried to join to children table (unnecessary)
EXISTS (SELECT 1 FROM children WHERE children.id = rewards.child_id)
```

**After (Correct):**
```sql
-- Uses existing parent_id column
WHERE auth.uid() = parent_id
```

## Verification

After running the corrected SQL, verify it worked:

```sql
-- 1. Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 2. Check function exists
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

-- 3. Check all policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Should see policies for:
-- - profiles (2 policies: SELECT, UPDATE)
-- - children (4 policies: SELECT, INSERT, UPDATE, DELETE)
-- - chores (4 policies: SELECT, INSERT, UPDATE, DELETE)
-- - chore_completions (4 policies: SELECT, INSERT, UPDATE, DELETE)
-- - story_chapters (4 policies: SELECT, INSERT, UPDATE, DELETE)
-- - story_progress (4 policies: SELECT, INSERT, UPDATE, DELETE)
-- - rewards (4 policies: SELECT, INSERT, UPDATE, DELETE)
-- - reward_redemptions (4 policies: SELECT, INSERT, UPDATE, DELETE)
-- - notifications (4 policies: SELECT, INSERT, UPDATE, DELETE)
```

## Testing

After applying the fix:

1. **Test Signup:**
   - Should work without RLS errors ✅

2. **Test Chore Creation:**
   - Create a chore
   - Should save successfully ✅

3. **Test Story Generation:**
   - Complete a chore
   - Generate story chapter
   - Should work ✅

## Files

- ❌ `supabase_rls_fix.sql` - **Don't use this** (has schema errors)
- ✅ `supabase_rls_fix_CORRECTED.sql` - **Use this one** (matches your schema)

---

**Bottom line:** Run `supabase_rls_fix_CORRECTED.sql` and you're good to go! 🚀



