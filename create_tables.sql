-- =====================================================
-- StoryStreaks Database Tables Status
-- =====================================================
-- UPDATE: All tables already exist in your Supabase database!
-- 
-- Confirmed existing tables in your 'public' schema:
-- ✅ children
-- ✅ chore_completions  
-- ✅ chores
-- ✅ notifications
-- ✅ profiles
-- ✅ reward_redemptions
-- ✅ rewards
-- ✅ story_chapters
-- ✅ story_progress
--
-- This script is no longer needed since all tables are already created.
-- The chore management system is working correctly!
-- =====================================================

-- =====================================================
-- CHORES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  recurrence TEXT NOT NULL CHECK (recurrence IN ('daily', 'weekly', 'one-time')),
  assigned_to UUID[] DEFAULT '{}',
  deadline TIMESTAMPTZ,
  template_id UUID,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CHORE COMPLETIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chore_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chore_id UUID NOT NULL REFERENCES public.chores(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  photo_url TEXT,
  parent_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STORY CHAPTERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.story_chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  world_theme TEXT NOT NULL CHECK (world_theme IN ('magical_forest', 'space_adventure', 'underwater_kingdom')),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STORY PROGRESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.story_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  world_theme TEXT NOT NULL CHECK (world_theme IN ('magical_forest', 'space_adventure', 'underwater_kingdom')),
  current_chapter INTEGER DEFAULT 1,
  total_chapters_unlocked INTEGER DEFAULT 0,
  last_chapter_read INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REWARDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  points_cost INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('badge', 'special_chapter', 'streak_boost', 'real_reward')),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REWARD REDEMPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  parent_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('chore_reminder', 'story_unlock', 'approval_request', 'reward_request')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CHORE TEMPLATES TABLE (Optional - for pre-built chores)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chore_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  points INTEGER NOT NULL,
  age_brackets TEXT[] DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('cleaning', 'hygiene', 'homework', 'behavior', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Chores indexes
CREATE INDEX IF NOT EXISTS idx_chores_parent_id ON public.chores(parent_id);
CREATE INDEX IF NOT EXISTS idx_chores_recurrence ON public.chores(recurrence);
CREATE INDEX IF NOT EXISTS idx_chores_created_at ON public.chores(created_at);

-- Chore completions indexes
CREATE INDEX IF NOT EXISTS idx_chore_completions_chore_id ON public.chore_completions(chore_id);
CREATE INDEX IF NOT EXISTS idx_chore_completions_child_id ON public.chore_completions(child_id);
CREATE INDEX IF NOT EXISTS idx_chore_completions_status ON public.chore_completions(status);

-- Story chapters indexes
CREATE INDEX IF NOT EXISTS idx_story_chapters_child_id ON public.story_chapters(child_id);
CREATE INDEX IF NOT EXISTS idx_story_chapters_world_theme ON public.story_chapters(world_theme);
CREATE INDEX IF NOT EXISTS idx_story_chapters_chapter_number ON public.story_chapters(chapter_number);

-- Story progress indexes
CREATE INDEX IF NOT EXISTS idx_story_progress_child_id ON public.story_progress(child_id);
CREATE INDEX IF NOT EXISTS idx_story_progress_world_theme ON public.story_progress(world_theme);

-- Rewards indexes
CREATE INDEX IF NOT EXISTS idx_rewards_parent_id ON public.rewards(parent_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON public.rewards(type);
CREATE INDEX IF NOT EXISTS idx_rewards_is_active ON public.rewards(is_active);

-- Reward redemptions indexes
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward_id ON public.reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_child_id ON public.reward_redemptions(child_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON public.reward_redemptions(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_chores_updated_at BEFORE UPDATE ON public.chores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_story_progress_updated_at BEFORE UPDATE ON public.story_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reward_redemptions_updated_at BEFORE UPDATE ON public.reward_redemptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
