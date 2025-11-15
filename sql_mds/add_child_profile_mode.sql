-- =====================================================
-- StoryStreaks Migration: Child Profile Mode
-- =====================================================
-- Adds a profile_mode column to distinguish between children
-- who share the parent profile and those with independent logins.
-- =====================================================

ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS profile_mode TEXT NOT NULL DEFAULT 'independent'
    CHECK (profile_mode IN ('shared', 'independent'));

-- Ensure existing rows have a valid value
UPDATE public.children
SET profile_mode = 'independent'
WHERE profile_mode IS NULL;

-- Optional: drop default if you prefer to set explicitly from the app
-- ALTER TABLE public.children ALTER COLUMN profile_mode DROP DEFAULT;
