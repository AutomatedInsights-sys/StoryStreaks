-- Drop unique constraint from story_chapters that prevents same chapter number for child in same world_theme
-- This is causing issues now that we have story_books where we might want to reuse chapter numbers (though technically story_book_id + chapter_number should be unique)
-- But for now, let's relax it or make it include story_book_id if it exists.

-- First, let's try to find the constraint name. It seems to be "story_chapters_child_id_chapter_number_world_theme_key" from the error.

ALTER TABLE public.story_chapters
DROP CONSTRAINT IF EXISTS story_chapters_child_id_chapter_number_world_theme_key;

-- We should add a new unique constraint that includes story_book_id
-- BUT, we have legacy chapters that don't have a story_book_id.
-- So we can create a partial unique index for chapters WITH a book_id.

CREATE UNIQUE INDEX IF NOT EXISTS idx_story_chapters_book_chapter 
ON public.story_chapters (story_book_id, chapter_number)
WHERE story_book_id IS NOT NULL;

-- For legacy chapters (no book_id), we can keep the old logic if we want, or just rely on app logic.
-- Let's create a unique index for legacy chapters just in case
CREATE UNIQUE INDEX IF NOT EXISTS idx_story_chapters_legacy_unique
ON public.story_chapters (child_id, chapter_number, world_theme)
WHERE story_book_id IS NULL;

