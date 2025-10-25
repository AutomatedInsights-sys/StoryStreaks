-- =====================================================
-- Manual Profile Creation Fix
-- =====================================================
-- If the trigger isn't working, run this to manually create profiles
-- for users who don't have them

-- 1. Create profiles for users who don't have them
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

-- 2. Verify the fix worked
SELECT 
  au.id,
  au.email,
  au.created_at as user_created_at,
  p.id as profile_id,
  p.name as profile_name,
  p.role as profile_role,
  p.created_at as profile_created_at
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
ORDER BY au.created_at DESC
LIMIT 10;



