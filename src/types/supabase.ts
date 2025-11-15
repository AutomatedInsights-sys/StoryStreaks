export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'parent' | 'child';
          parent_id: string | null;
          age_bracket: '4-6' | '7-8' | '9-10' | null;
          avatar_url: string | null;
          world_theme: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: 'parent' | 'child';
          parent_id?: string | null;
          age_bracket?: '4-6' | '7-8' | '9-10' | null;
          avatar_url?: string | null;
          world_theme?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'parent' | 'child';
          parent_id?: string | null;
          age_bracket?: '4-6' | '7-8' | '9-10' | null;
          avatar_url?: string | null;
          world_theme?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      children: {
        Row: {
          id: string;
          name: string;
          age: number;
          age_bracket: '4-6' | '7-8' | '9-10';
          avatar_url: string | null;
          world_theme: string;
          parent_id: string;
          current_streak: number;
          total_points: number;
          profile_mode: 'shared' | 'independent';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          age: number;
          age_bracket: '4-6' | '7-8' | '9-10';
          avatar_url?: string | null;
          world_theme: string;
          parent_id: string;
          current_streak?: number;
          total_points?: number;
          profile_mode?: 'shared' | 'independent';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          age?: number;
          age_bracket?: '4-6' | '7-8' | '9-10';
          avatar_url?: string | null;
          world_theme?: string;
          parent_id?: string;
          current_streak?: number;
          total_points?: number;
          profile_mode?: 'shared' | 'independent';
          created_at?: string;
          updated_at?: string;
        };
      };
      chores: {
        Row: {
          id: string;
          title: string;
          description: string;
          points: number;
          recurrence: 'daily' | 'weekly' | 'one-time';
          assigned_to: string[];
          deadline: string | null;
          template_id: string | null;
          parent_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          points: number;
          recurrence: 'daily' | 'weekly' | 'one-time';
          assigned_to: string[];
          deadline?: string | null;
          template_id?: string | null;
          parent_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          points?: number;
          recurrence?: 'daily' | 'weekly' | 'one-time';
          assigned_to?: string[];
          deadline?: string | null;
          template_id?: string | null;
          parent_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      chore_completions: {
        Row: {
          id: string;
          chore_id: string;
          child_id: string;
          completed_at: string;
          status: 'pending' | 'approved' | 'rejected';
          photo_url: string | null;
          parent_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          chore_id: string;
          child_id: string;
          completed_at?: string;
          status?: 'pending' | 'approved' | 'rejected';
          photo_url?: string | null;
          parent_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          chore_id?: string;
          child_id?: string;
          completed_at?: string;
          status?: 'pending' | 'approved' | 'rejected';
          photo_url?: string | null;
          parent_notes?: string | null;
          created_at?: string;
        };
      };
      rewards: {
        Row: {
          id: string;
          title: string;
          description: string;
          points_cost: number;
          type: 'badge' | 'special_chapter' | 'streak_boost' | 'real_reward';
          parent_id: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          points_cost: number;
          type: 'badge' | 'special_chapter' | 'streak_boost' | 'real_reward';
          parent_id: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          points_cost?: number;
          type?: 'badge' | 'special_chapter' | 'streak_boost' | 'real_reward';
          parent_id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      reward_redemptions: {
        Row: {
          id: string;
          reward_id: string;
          child_id: string;
          status: 'pending' | 'approved' | 'denied';
          parent_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reward_id: string;
          child_id: string;
          status?: 'pending' | 'approved' | 'denied';
          parent_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reward_id?: string;
          child_id?: string;
          status?: 'pending' | 'approved' | 'denied';
          parent_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      story_chapters: {
        Row: {
          id: string;
          child_id: string;
          chapter_number: number;
          title: string;
          content: string;
          image_url: string | null;
          world_theme: string;
          unlocked_at: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          chapter_number: number;
          title: string;
          content: string;
          image_url?: string | null;
          world_theme: string;
          unlocked_at?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          chapter_number?: number;
          title?: string;
          content?: string;
          image_url?: string | null;
          world_theme?: string;
          unlocked_at?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
      story_progress: {
        Row: {
          id: string;
          child_id: string;
          world_theme: string;
          current_chapter: number;
          total_chapters_unlocked: number;
          last_chapter_read: number | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          world_theme: string;
          current_chapter?: number;
          total_chapters_unlocked?: number;
          last_chapter_read?: number | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          world_theme?: string;
          current_chapter?: number;
          total_chapters_unlocked?: number;
          last_chapter_read?: number | null;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'chore_reminder' | 'story_unlock' | 'approval_request' | 'reward_request';
          title: string;
          message: string;
          data: Json | null;
          is_read: boolean;
          scheduled_for: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'chore_reminder' | 'story_unlock' | 'approval_request' | 'reward_request';
          title: string;
          message: string;
          data?: Json | null;
          is_read?: boolean;
          scheduled_for?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'chore_reminder' | 'story_unlock' | 'approval_request' | 'reward_request';
          title?: string;
          message?: string;
          data?: Json | null;
          is_read?: boolean;
          scheduled_for?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
