-- =====================================================
-- CLEANUP SCRIPT: RESET STORIES
-- =====================================================
-- WARNING: This will delete ALL story progress, chapters, and books for all children.
-- Use this to start fresh with the new Book system.

-- 1. Delete all Story Chapters
DELETE FROM public.story_chapters;

-- 2. Delete all Story Books
DELETE FROM public.story_books;

-- 3. Reset Story Progress
-- We can either delete the rows or reset the counters.
-- Deleting is cleaner as they will be recreated when needed.
DELETE FROM public.story_progress;

-- 4. (Optional) Reset Chore Completions status if you want to re-use them for testing
-- UPDATE public.chore_completions 
-- SET status = 'pending' 
-- WHERE status = 'approved';

-- Reset ID sequences if necessary (unlikely for UUIDs)

