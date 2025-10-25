-- =====================================================
-- Debug Trigger and Profile Creation
-- =====================================================
-- Run these queries in Supabase SQL Editor to debug the issue

-- 1. Check if trigger exists and is active
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check if function exists
SELECT 
  proname,
  prosecdef,
  proargnames,
  prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. Check if RLS is enabled on profiles table
SELECT 
  tablename,
  rowsecurity,
  hasrls
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 4. Check RLS policies on profiles table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 5. Check if profiles table has the right structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 6. Check recent users in auth.users
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 7. Check if profiles exist for recent users
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

-- 8. Check for users without profiles
SELECT 
  au.id,
  au.email,
  au.created_at as user_created_at,
  p.id as profile_id,
  p.created_at as profile_created_at
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC
LIMIT 5;



