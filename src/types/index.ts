// Core Types for StoryStreaks App

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'parent' | 'child';
  parent_id?: string;
  age_bracket?: '4-6' | '7-8' | '9-10';
  avatar_url?: string;
  world_theme?: StoryWorld;
  parent_pin?: string;
  pin_last_verified?: string;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  age_bracket: '4-6' | '7-8' | '9-10';
  avatar_url?: string;
  world_theme: StoryWorld;
  parent_id: string;
  current_streak: number;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface Chore {
  id: string;
  title: string;
  description: string;
  points: number;
  recurrence: 'daily' | 'weekly' | 'one-time';
  assigned_to: string[]; // child IDs
  deadline?: string; // for one-time chores
  template_id?: string;
  parent_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChoreCompletion {
  id: string;
  chore_id: string;
  child_id: string;
  completed_at: string;
  status: 'pending' | 'approved' | 'rejected';
  photo_url?: string;
  parent_notes?: string;
  created_at: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  type: 'badge' | 'special_chapter' | 'streak_boost' | 'real_reward';
  parent_id: string;
  is_active: boolean;
  thumbnail_url?: string | null;
  category?: string | null;
  fulfillment_instructions?: string | null;
  estimated_fulfillment_time?: string | null;
  auto_approve?: boolean | null;
  is_recurring?: boolean | null;
  quantity?: number | null;
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
  id: string;
  reward_id: string;
  child_id: string;
  status: 'pending' | 'approved' | 'denied';
  parent_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StoryChapter {
  id: string;
  story_book_id?: string;
  child_id: string;
  chapter_number: number;
  title: string;
  content: string;
  image_url?: string;
  world_theme: StoryWorld;
  unlocked_at: string;
  is_read: boolean;
  created_at: string;
}

export interface StoryProgress {
  id: string;
  child_id: string;
  world_theme: StoryWorld;
  current_chapter: number;
  total_chapters_unlocked: number;
  last_chapter_read?: number;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'chore_reminder' | 'story_unlock' | 'approval_request' | 'reward_request';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  scheduled_for?: string;
  sent_at?: string;
  created_at: string;
}

export type StoryWorld = 'magical_forest' | 'space_adventure' | 'underwater_kingdom';

export interface StoryBook {
  id: string;
  child_id: string;
  title: string;
  theme: StoryWorld;
  status: 'active' | 'completed';
  total_chapters: number;
  current_chapter: number;
  outline: StoryChapterOutline[];
  created_at: string;
  completed_at?: string;
  updated_at: string;
}

export interface StoryChapterOutline {
  chapter_number: number;
  title: string;
  synopsis: string;
}

export interface ChoreTemplate {
  id: string;
  title: string;
  description: string;
  points: number;
  age_brackets: string[];
  category: 'cleaning' | 'hygiene' | 'homework' | 'behavior' | 'other';
  created_at: string;
}

// Profile Selection Types
export interface ProfileSelectionState {
  selectedProfile: 'parent' | Child | null;
  isPinVerified: boolean;
  pinVerifiedAt: Date | null;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  ProfileSelection: undefined;
  ParentStack: undefined;
  ChildStack: { childId: string };
};

export type ParentStackParamList = {
  ParentHome: undefined;
  ChoreManagement: undefined;
  ChildProfiles: undefined;
  Settings: undefined;
  Analytics: undefined;
  CreateChore: undefined;
  EditChore: { choreId: string };
  ChoreApproval: undefined;
  RewardsManagement: undefined;
  RewardRequests: undefined;
  ChildDetail: { childId: string };
  CreateChild: undefined;
};

export type ChildStackParamList = {
  ChildHome: undefined;
  ChoreDetail: { choreId: string };
  StoriesList: undefined;
  StoryReader: { chapterId: string };
  Rewards: undefined;
  MyProgress: undefined;
  Achievements: undefined;
};

// Form Types
export interface CreateChildForm {
  name: string;
  age: number;
  world_theme: StoryWorld;
  avatar?: File;
}

export interface CreateChoreForm {
  title: string;
  description: string;
  points: number;
  recurrence: 'daily' | 'weekly' | 'one-time';
  assigned_to: string[];
  deadline?: Date;
}

export interface CreateRewardForm {
  title: string;
  description: string;
  points_cost: number;
  type: 'badge' | 'special_chapter' | 'streak_boost' | 'real_reward';
  thumbnail_url?: string;
  category?: string;
  fulfillment_instructions?: string;
  estimated_fulfillment_time?: string;
  auto_approve: boolean;
  is_recurring: boolean;
  quantity?: number | null;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Auth Types
export interface AuthState {
  user: Profile | null;
  children: Child[];
  currentChild: Child | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// AI Story Generation Types
export interface StoryGenerationRequest {
  childId: string;
  childName: string;
  ageBracket: string;
  worldTheme: StoryWorld;
  completedChores: string[];
  previousChapterSummary?: string;
  chapterNumber: number;
  bookId?: string;
  chapterSynopsis?: string;
  chapterTitle?: string;
}

export interface StoryGenerationResponse {
  success: boolean;
  chapter?: StoryChapter;
  error?: string;
  fallbackUsed?: boolean;
}

export interface StoryOutlineRequest {
  childId: string;
  childName: string;
  ageBracket: string;
  worldTheme: StoryWorld;
  totalChapters: number;
}

export interface AIProvider {
  name: 'openai' | 'gemini' | 'claude';
  generateStory(request: StoryGenerationRequest): Promise<StoryGenerationResponse>;
  generateStoryOutline(request: StoryOutlineRequest): Promise<StoryChapterOutline[]>;
  moderateContent(content: string): Promise<boolean>;
}

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    success: string;
    warning: string;
    error: string;
    border: string;
  };
  fonts: {
    regular: string;
    bold: string;
    large: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}
