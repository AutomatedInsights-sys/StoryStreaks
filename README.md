# StoryStreaks - Interactive Kids' Chores & AI Storytelling App

A React Native app that gamifies chores for children by turning them into story-driven adventures. When children complete chores, they unlock personalized AI-generated story chapters.

## Features

- **Parent Dashboard**: Manage children's profiles, create chores, track progress
- **Child Interface**: Age-appropriate chore completion with visual feedback
- **AI Story Generation**: Personalized stories based on completed chores
- **Rewards System**: Points, badges, and achievement tracking
- **Privacy & Safety**: COPPA-compliant with parental controls

## Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: Flexible provider support (OpenAI, Gemini, Claude)
- **Navigation**: React Navigation
- **State Management**: React Context

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator or Android Studio (for testing)

### 1. Clone and Install

```bash
git clone <repository-url>
cd StoryStreaks
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI Provider Configuration (at least one required)
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
EXPO_PUBLIC_CLAUDE_API_KEY=your_claude_api_key_here

# Default AI Provider
EXPO_PUBLIC_DEFAULT_AI_PROVIDER=openai

# App Configuration
EXPO_PUBLIC_APP_NAME=StoryStreaks
EXPO_PUBLIC_MAX_CHILDREN_PER_PARENT=4
EXPO_PUBLIC_MAX_STORY_WORLDS=3
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the following SQL to create the database schema:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('parent', 'child')) NOT NULL,
  parent_id UUID REFERENCES profiles(id),
  age_bracket TEXT CHECK (age_bracket IN ('4-6', '7-8', '9-10')),
  avatar_url TEXT,
  world_theme TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create children table
CREATE TABLE children (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 4 AND age <= 10),
  age_bracket TEXT CHECK (age_bracket IN ('4-6', '7-8', '9-10')) NOT NULL,
  avatar_url TEXT,
  world_theme TEXT NOT NULL,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chores table
CREATE TABLE chores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  recurrence TEXT CHECK (recurrence IN ('daily', 'weekly', 'one-time')) NOT NULL,
  assigned_to UUID[] NOT NULL DEFAULT '{}',
  deadline TIMESTAMP WITH TIME ZONE,
  template_id UUID,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chore_completions table
CREATE TABLE chore_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chore_id UUID REFERENCES chores(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  photo_url TEXT,
  parent_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rewards table
CREATE TABLE rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  points_cost INTEGER NOT NULL DEFAULT 1,
  type TEXT CHECK (type IN ('badge', 'special_chapter', 'streak_boost', 'real_reward')) NOT NULL,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reward_redemptions table
CREATE TABLE reward_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'denied')) DEFAULT 'pending',
  parent_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create story_chapters table
CREATE TABLE story_chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  world_theme TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, chapter_number, world_theme)
);

-- Create story_progress table
CREATE TABLE story_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  world_theme TEXT NOT NULL,
  current_chapter INTEGER DEFAULT 1,
  total_chapters_unlocked INTEGER DEFAULT 0,
  last_chapter_read INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, world_theme)
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT CHECK (type IN ('chore_reminder', 'story_unlock', 'approval_request', 'reward_request')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_profiles_parent_id ON profiles(parent_id);
CREATE INDEX idx_children_parent_id ON children(parent_id);
CREATE INDEX idx_chores_parent_id ON chores(parent_id);
CREATE INDEX idx_chore_completions_child_id ON chore_completions(child_id);
CREATE INDEX idx_chore_completions_status ON chore_completions(status);
CREATE INDEX idx_story_chapters_child_id ON story_chapters(child_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Row Level Security Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Parents can view own children" ON children FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Parents can manage own children" ON children FOR ALL USING (parent_id = auth.uid());
CREATE POLICY "Parents can manage own chores" ON chores FOR ALL USING (parent_id = auth.uid());
CREATE POLICY "Parents can view own chore completions" ON chore_completions FOR SELECT USING (
  chore_id IN (SELECT id FROM chores WHERE parent_id = auth.uid())
);
CREATE POLICY "Children can view own chore completions" ON chore_completions FOR SELECT USING (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
);
```

3. Set up Storage bucket for photos:
   - Go to Storage in Supabase dashboard
   - Create a new bucket called "chore-photos"
   - Set up appropriate policies for file uploads

### 4. AI Provider Setup

Choose at least one AI provider:

#### OpenAI
1. Get API key from [OpenAI Platform](https://platform.openai.com)
2. Add to `.env`: `EXPO_PUBLIC_OPENAI_API_KEY=your_key_here`

#### Google Gemini
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env`: `EXPO_PUBLIC_GEMINI_API_KEY=your_key_here`

#### Claude (Anthropic)
1. Get API key from [Anthropic Console](https://console.anthropic.com)
2. Add to `.env`: `EXPO_PUBLIC_CLAUDE_API_KEY=your_key_here`

### 5. Run the App

```bash
# Start the development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web (for testing)
npm run web
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── shared/         # Shared components
├── screens/            # Screen components
│   ├── parent/         # Parent-specific screens
│   └── child/          # Child-specific screens
├── navigation/         # Navigation configuration
├── services/           # API and external services
├── contexts/           # React Context providers
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── ai/                 # AI story generation
```

## Key Features Implementation

### Authentication
- Email/password signup and login
- Parent and child profile management
- Secure session handling with Supabase Auth

### Chore Management
- Create, edit, and assign chores
- Recurring and one-time chores
- Photo verification for completion
- Parent approval workflow

### Story Generation
- AI-powered story creation based on completed chores
- Multiple AI provider support with fallback
- Age-appropriate content with safety filters
- Story progress tracking

### Rewards System
- Points-based reward system
- Badge achievements
- Special story chapters
- Parent-managed reward catalog

## Development Notes

- All data is COPPA-compliant with no public sharing
- Parental gate for settings and purchases
- Age-appropriate UI with large buttons and simple navigation
- Content moderation for AI-generated stories
- Fallback curated stories if AI generation fails

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
