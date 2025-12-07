-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- STORY BOOKS TABLE (New Container)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.story_books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  theme TEXT NOT NULL CHECK (theme IN ('magical_forest', 'space_adventure', 'underwater_kingdom')),
  status TEXT NOT NULL CHECK (status IN ('active', 'completed')) DEFAULT 'active',
  total_chapters INTEGER NOT NULL DEFAULT 10,
  current_chapter INTEGER DEFAULT 1,
  -- The outline will store the pre-generated plan: 
  -- [{ "chapter": 1, "title": "The Beginning", "synopsis": "..." }, ...]
  outline JSONB, 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- UPDATE CHAPTERS TABLE
-- =====================================================
-- Link chapters to books
ALTER TABLE public.story_chapters
ADD COLUMN IF NOT EXISTS story_book_id UUID REFERENCES public.story_books(id) ON DELETE CASCADE;

-- Add a column to store the specific prompt used for this chapter (good for debugging)
ALTER TABLE public.story_chapters
ADD COLUMN IF NOT EXISTS outline_prompt TEXT;

-- =====================================================
-- INDEXES & TRIGGERS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_story_books_child_id ON public.story_books(child_id);
CREATE INDEX IF NOT EXISTS idx_story_books_status ON public.story_books(status);
CREATE INDEX IF NOT EXISTS idx_story_chapters_book_id ON public.story_chapters(story_book_id);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_story_books_updated_at ON public.story_books;
CREATE TRIGGER update_story_books_updated_at 
BEFORE UPDATE ON public.story_books 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE public.story_books ENABLE ROW LEVEL SECURITY;

-- 1. Parents can view books for their children
DROP POLICY IF EXISTS "Parents can view their children's books" ON public.story_books;
CREATE POLICY "Parents can view their children's books"
ON public.story_books FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.children
    WHERE id = story_books.child_id
    AND parent_id = auth.uid()
  )
);

-- 2. Parents can insert books for their children
DROP POLICY IF EXISTS "Parents can create books" ON public.story_books;
CREATE POLICY "Parents can create books"
ON public.story_books FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.children
    WHERE id = story_books.child_id
    AND parent_id = auth.uid()
  )
);

-- 3. Parents can update books
DROP POLICY IF EXISTS "Parents can update books" ON public.story_books;
CREATE POLICY "Parents can update books"
ON public.story_books FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.children
    WHERE id = story_books.child_id
    AND parent_id = auth.uid()
  )
);
