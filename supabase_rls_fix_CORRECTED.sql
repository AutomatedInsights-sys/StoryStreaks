-- =====================================================
-- StoryStreaks RLS Fix: Auto-create profiles on signup
-- CORRECTED VERSION - Matches your actual database schema
-- =====================================================
-- This SQL script fixes the RLS authentication issue by:
-- 1. Creating a trigger that automatically creates profiles
-- 2. Setting up proper RLS policies for all tables
-- 3. Ensuring secure access patterns
-- =====================================================

-- Step 1: Create function to handle new user signup
-- This runs with elevated privileges (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    'parent',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Step 2: Create trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Drop existing RLS policies and create proper ones

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Note: We don't need an INSERT policy for profiles anymore
-- because the trigger handles profile creation

-- =====================================================
-- CHILDREN TABLE POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Parents can view own children" ON children;
DROP POLICY IF EXISTS "Parents can insert own children" ON children;
DROP POLICY IF EXISTS "Parents can update own children" ON children;
DROP POLICY IF EXISTS "Parents can delete own children" ON children;

CREATE POLICY "Parents can view own children"
  ON children FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert own children"
  ON children FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update own children"
  ON children FOR UPDATE
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can delete own children"
  ON children FOR DELETE
  USING (auth.uid() = parent_id);

-- =====================================================
-- CHORES TABLE POLICIES
-- Chores belong directly to parents (parent_id column)
-- =====================================================
DROP POLICY IF EXISTS "Parents can manage chores for their children" ON chores;
DROP POLICY IF EXISTS "Parents can view chores" ON chores;
DROP POLICY IF EXISTS "Parents can insert chores" ON chores;
DROP POLICY IF EXISTS "Parents can update chores" ON chores;
DROP POLICY IF EXISTS "Parents can delete chores" ON chores;

CREATE POLICY "Parents can view own chores"
  ON chores FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert own chores"
  ON chores FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update own chores"
  ON chores FOR UPDATE
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can delete own chores"
  ON chores FOR DELETE
  USING (auth.uid() = parent_id);

-- =====================================================
-- CHORE COMPLETIONS TABLE POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Parents can view completions" ON chore_completions;
DROP POLICY IF EXISTS "Parents can insert completions" ON chore_completions;
DROP POLICY IF EXISTS "Parents can update completions" ON chore_completions;
DROP POLICY IF EXISTS "Parents can delete completions" ON chore_completions;

CREATE POLICY "Parents can view chore completions"
  ON chore_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = chore_completions.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can insert chore completions"
  ON chore_completions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update chore completions"
  ON chore_completions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = chore_completions.child_id
      AND children.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can delete chore completions"
  ON chore_completions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = chore_completions.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- =====================================================
-- STORY CHAPTERS TABLE POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Parents can view story chapters" ON story_chapters;
DROP POLICY IF EXISTS "Parents can insert story chapters" ON story_chapters;
DROP POLICY IF EXISTS "Parents can update story chapters" ON story_chapters;
DROP POLICY IF EXISTS "Parents can delete story chapters" ON story_chapters;

CREATE POLICY "Parents can view story chapters"
  ON story_chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = story_chapters.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can insert story chapters"
  ON story_chapters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update story chapters"
  ON story_chapters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = story_chapters.child_id
      AND children.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can delete story chapters"
  ON story_chapters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = story_chapters.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- =====================================================
-- STORY PROGRESS TABLE POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Parents can view story progress" ON story_progress;
DROP POLICY IF EXISTS "Parents can insert story progress" ON story_progress;
DROP POLICY IF EXISTS "Parents can update story progress" ON story_progress;
DROP POLICY IF EXISTS "Parents can delete story progress" ON story_progress;

CREATE POLICY "Parents can view story progress"
  ON story_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = story_progress.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can insert story progress"
  ON story_progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update story progress"
  ON story_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = story_progress.child_id
      AND children.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can delete story progress"
  ON story_progress FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = story_progress.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- =====================================================
-- REWARDS TABLE POLICIES
-- Rewards belong directly to parents (parent_id column)
-- =====================================================
DROP POLICY IF EXISTS "Parents can view rewards" ON rewards;
DROP POLICY IF EXISTS "Parents can insert rewards" ON rewards;
DROP POLICY IF EXISTS "Parents can update rewards" ON rewards;
DROP POLICY IF EXISTS "Parents can delete rewards" ON rewards;

CREATE POLICY "Parents can view own rewards"
  ON rewards FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert own rewards"
  ON rewards FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update own rewards"
  ON rewards FOR UPDATE
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can delete own rewards"
  ON rewards FOR DELETE
  USING (auth.uid() = parent_id);

-- =====================================================
-- REWARD REDEMPTIONS TABLE POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Parents can view reward redemptions" ON reward_redemptions;
DROP POLICY IF EXISTS "Parents can insert reward redemptions" ON reward_redemptions;
DROP POLICY IF EXISTS "Parents can update reward redemptions" ON reward_redemptions;
DROP POLICY IF EXISTS "Parents can delete reward redemptions" ON reward_redemptions;

CREATE POLICY "Parents can view reward redemptions"
  ON reward_redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = reward_redemptions.child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can insert reward redemptions"
  ON reward_redemptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update reward redemptions"
  ON reward_redemptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = reward_redemptions.child_id
      AND children.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = child_id
      AND children.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can delete reward redemptions"
  ON reward_redemptions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = reward_redemptions.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Verification queries (run these to test)
-- =====================================================

-- Check if trigger exists
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if function exists
-- SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

-- List all RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- Check which tables have RLS enabled
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public';


