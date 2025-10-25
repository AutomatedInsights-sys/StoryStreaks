import { supabase } from './supabase';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'chores' | 'reading' | 'streak' | 'special';
  requirement: number;
  points_reward: number;
  is_unlocked: boolean;
  unlocked_at?: string;
  progress: number; // 0-100
}

export interface AchievementProgress {
  total_achievements: number;
  unlocked_achievements: number;
  total_points_earned: number;
  recent_achievements: Achievement[];
}

export class AchievementService {
  // Get all achievements for a child
  static async getAchievements(childId: string): Promise<Achievement[]> {
    try {
      // Get child's progress data
      const { data: child } = await supabase
        .from('children')
        .select('total_points, current_streak')
        .eq('id', childId)
        .single();

      if (!child) return [];

      // Get chore completion stats
      const { data: choreStats } = await supabase
        .from('chore_completions')
        .select('status, completed_at')
        .eq('child_id', childId)
        .eq('status', 'approved');

      // Get reading stats
      const { data: readingStats } = await supabase
        .from('reading_sessions')
        .select('reading_duration, created_at')
        .eq('child_id', childId)
        .not('reading_duration', 'is', null);

      // Get story chapters read
      const { data: storiesRead } = await supabase
        .from('story_chapters')
        .select('is_read')
        .eq('child_id', childId)
        .eq('is_read', true);

      // Define achievement templates
      const achievementTemplates = [
        // Chore achievements
        {
          id: 'first_chore',
          title: 'First Steps',
          description: 'Complete your first chore',
          icon: '👶',
          category: 'chores' as const,
          requirement: 1,
          points_reward: 10,
        },
        {
          id: 'chore_master_5',
          title: 'Getting Started',
          description: 'Complete 5 chores',
          icon: '🌟',
          category: 'chores' as const,
          requirement: 5,
          points_reward: 25,
        },
        {
          id: 'chore_master_25',
          title: 'Chore Champion',
          description: 'Complete 25 chores',
          icon: '🏆',
          category: 'chores' as const,
          requirement: 25,
          points_reward: 100,
        },
        {
          id: 'chore_master_50',
          title: 'Chore Superstar',
          description: 'Complete 50 chores',
          icon: '⭐',
          category: 'chores' as const,
          requirement: 50,
          points_reward: 250,
        },
        {
          id: 'chore_master_100',
          title: 'Chore Legend',
          description: 'Complete 100 chores',
          icon: '👑',
          category: 'chores' as const,
          requirement: 100,
          points_reward: 500,
        },

        // Streak achievements
        {
          id: 'streak_3',
          title: 'Getting Hot',
          description: 'Complete chores for 3 days in a row',
          icon: '🔥',
          category: 'streak' as const,
          requirement: 3,
          points_reward: 30,
        },
        {
          id: 'streak_7',
          title: 'Week Warrior',
          description: 'Complete chores for 7 days in a row',
          icon: '💪',
          category: 'streak' as const,
          requirement: 7,
          points_reward: 75,
        },
        {
          id: 'streak_14',
          title: 'Two Week Titan',
          description: 'Complete chores for 14 days in a row',
          icon: '⚡',
          category: 'streak' as const,
          requirement: 14,
          points_reward: 150,
        },
        {
          id: 'streak_30',
          title: 'Monthly Master',
          description: 'Complete chores for 30 days in a row',
          icon: '🏅',
          category: 'streak' as const,
          requirement: 30,
          points_reward: 300,
        },

        // Reading achievements
        {
          id: 'first_story',
          title: 'Story Starter',
          description: 'Read your first story chapter',
          icon: '📖',
          category: 'reading' as const,
          requirement: 1,
          points_reward: 15,
        },
        {
          id: 'bookworm_5',
          title: 'Bookworm',
          description: 'Read 5 story chapters',
          icon: '📚',
          category: 'reading' as const,
          requirement: 5,
          points_reward: 50,
        },
        {
          id: 'bookworm_15',
          title: 'Reading Rockstar',
          description: 'Read 15 story chapters',
          icon: '🌟',
          category: 'reading' as const,
          requirement: 15,
          points_reward: 125,
        },
        {
          id: 'bookworm_30',
          title: 'Story Master',
          description: 'Read 30 story chapters',
          icon: '🎭',
          category: 'reading' as const,
          requirement: 30,
          points_reward: 300,
        },

        // Special achievements
        {
          id: 'points_100',
          title: 'Century Club',
          description: 'Earn 100 total points',
          icon: '💯',
          category: 'special' as const,
          requirement: 100,
          points_reward: 50,
        },
        {
          id: 'points_500',
          title: 'Half Grand',
          description: 'Earn 500 total points',
          icon: '🎯',
          category: 'special' as const,
          requirement: 500,
          points_reward: 100,
        },
        {
          id: 'points_1000',
          title: 'Grand Master',
          description: 'Earn 1000 total points',
          icon: '👑',
          category: 'special' as const,
          requirement: 1000,
          points_reward: 200,
        },
      ];

      // Calculate progress for each achievement
      const achievements: Achievement[] = achievementTemplates.map(template => {
        let progress = 0;
        let isUnlocked = false;

        switch (template.category) {
          case 'chores':
            progress = Math.min(100, (choreStats?.length || 0) / template.requirement * 100);
            isUnlocked = (choreStats?.length || 0) >= template.requirement;
            break;
          case 'streak':
            progress = Math.min(100, (child.current_streak || 0) / template.requirement * 100);
            isUnlocked = (child.current_streak || 0) >= template.requirement;
            break;
          case 'reading':
            progress = Math.min(100, (storiesRead?.length || 0) / template.requirement * 100);
            isUnlocked = (storiesRead?.length || 0) >= template.requirement;
            break;
          case 'special':
            progress = Math.min(100, (child.total_points || 0) / template.requirement * 100);
            isUnlocked = (child.total_points || 0) >= template.requirement;
            break;
        }

        return {
          ...template,
          is_unlocked: isUnlocked,
          progress: Math.round(progress),
        };
      });

      return achievements;
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }

  // Get achievement progress summary
  static async getAchievementProgress(childId: string): Promise<AchievementProgress> {
    try {
      const achievements = await this.getAchievements(childId);
      
      const unlockedAchievements = achievements.filter(a => a.is_unlocked);
      const totalPointsEarned = unlockedAchievements.reduce((sum, a) => sum + a.points_reward, 0);
      const recentAchievements = unlockedAchievements.slice(-3); // Last 3 unlocked

      return {
        total_achievements: achievements.length,
        unlocked_achievements: unlockedAchievements.length,
        total_points_earned: totalPointsEarned,
        recent_achievements: recentAchievements,
      };
    } catch (error) {
      console.error('Error getting achievement progress:', error);
      return {
        total_achievements: 0,
        unlocked_achievements: 0,
        total_points_earned: 0,
        recent_achievements: [],
      };
    }
  }

  // Check for newly unlocked achievements
  static async checkNewAchievements(childId: string): Promise<Achievement[]> {
    try {
      const achievements = await this.getAchievements(childId);
      return achievements.filter(a => a.is_unlocked && a.progress === 100);
    } catch (error) {
      console.error('Error checking new achievements:', error);
      return [];
    }
  }

  // Get achievements by category
  static async getAchievementsByCategory(childId: string, category: Achievement['category']): Promise<Achievement[]> {
    try {
      const achievements = await this.getAchievements(childId);
      return achievements.filter(a => a.category === category);
    } catch (error) {
      console.error('Error getting achievements by category:', error);
      return [];
    }
  }
}
