-- =====================================================
-- Manual Profile Creation - Troubleshooting
-- =====================================================
-- If you got an error creating the profile manually, try these solutions

-- =====================================================
-- SOLUTION 1: Check if profile already exists
-- =====================================================
-- First, check if the profile already exists
SELECT * FROM profiles WHERE id = '6d726330-c21f-47c7-addd-9394e0e041ee';

-- If it exists, you'll see the profile data
-- If it doesn't exist, you'll see 0 rows

-- =====================================================
-- SOLUTION 2: Check table structure
-- =====================================================
-- Make sure the profiles table has the right columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid, not null)
-- email (text, not null) 
-- name (text, not null)
-- role (text, not null)
-- created_at (timestamp, not null)
-- updated_at (timestamp, not null)

-- =====================================================
-- SOLUTION 3: Try different INSERT syntax
-- =====================================================
-- If the first INSERT failed, try this version:

INSERT INTO public.profiles (
  id, 
  email, 
  name, 
  role, 
  created_at, 
  updated_at
) VALUES (
  '6d726330-c21f-47c7-addd-9394e0e041ee',
  'damiensimmons02+test@gmail.com',
  'Joel Jeffrey',
  'parent',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

-- =====================================================
-- SOLUTION 4: Check RLS policies
-- =====================================================
-- If you get RLS errors, check the policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- =====================================================
-- SOLUTION 5: Temporarily disable RLS (if needed)
-- =====================================================
-- ONLY if RLS is blocking the insert, temporarily disable it
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Then try the INSERT again:
-- INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
-- VALUES ('6d726330-c21f-47c7-addd-9394e0e041ee', 'damiensimmons02+test@gmail.com', 'Joel Jeffrey', 'parent', NOW(), NOW());

-- Re-enable RLS after successful insert:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SOLUTION 6: Use UPSERT instead of INSERT
-- =====================================================
-- If the profile might already exist, use UPSERT:
INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
VALUES (
  '6d726330-c21f-47c7-addd-9394e0e041ee',
  'damiensimmons02+test@gmail.com', 
  'Joel Jeffrey',
  'parent',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SOLUTION 7: Check for constraint violations
-- =====================================================
-- Check if there are any unique constraints that might be violated
SELECT 
  constraint_name,
  constraint_type,
  column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'profiles'
  AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After successful insert, verify the profile exists:
SELECT * FROM profiles WHERE id = '6d726330-c21f-47c7-addd-9394e0e041ee';

-- Should return 1 row with the profile data



