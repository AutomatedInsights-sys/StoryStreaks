import { supabase } from './supabase';
import { ReadingProgressService } from './readingProgressService';
import { AchievementService } from './achievementService';

export interface ChildAnalytics {
  child_id: string;
  child_name: string;
  total_chores_completed: number;
  total_chores_pending: number;
  total_chores_rejected: number;
  current_streak: number;
  longest_streak: number;
  total_points: number;
  average_points_per_day: number;
  stories_unlocked: number;
  chapters_read: number;
  reading_time_minutes: number;
  reading_speed_wpm: number;
  reading_streak_days: number;
  achievements_unlocked: number;
  total_achievements: number;
  favorite_world_theme: string;
  last_activity: string;
  engagement_score: number; // 0-100
}

export interface ParentDashboardAnalytics {
  total_children: number;
  total_chores_created: number;
  total_stories_generated: number;
  children_analytics: ChildAnalytics[];
  overall_engagement: number;
  most_active_child: string;
  least_active_child: string;
  weekly_activity: {
    date: string;
    chores_completed: number;
    stories_read: number;
    points_earned: number;
  }[];
  monthly_trends: {
    month: string;
    chores_completed: number;
    stories_generated: number;
    average_engagement: number;
  }[];
}

export class AnalyticsService {
  // Get comprehensive analytics for a parent
  static async getParentDashboardAnalytics(parentId: string): Promise<ParentDashboardAnalytics | null> {
    try {
      console.log('Getting analytics for parent:', parentId);
      
      // Get all children for this parent
      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', parentId);

      if (childrenError) {
        console.error('Error fetching children:', childrenError);
        return null;
      }

      if (!children || children.length === 0) {
        console.log('No children found for parent');
        return {
          total_children: 0,
          total_chores_created: 0,
          total_stories_generated: 0,
          children_analytics: [],
          overall_engagement: 0,
          most_active_child: '',
          least_active_child: '',
          weekly_activity: [],
          monthly_trends: [],
        };
      }

      // Get children analytics
      const childrenAnalytics: ChildAnalytics[] = [];
      for (const child of children) {
        const analytics = await this.getChildAnalytics(child.id);
        if (analytics) {
          childrenAnalytics.push(analytics);
        }
      }

      // Get parent's total stats
      const { data: parentStats } = await supabase
        .from('chores')
        .select('id')
        .eq('parent_id', parentId);

      const { data: storyStats } = await supabase
        .from('story_chapters')
        .select('id')
        .in('child_id', children.map(c => c.id));

      // Calculate overall engagement
      const totalEngagement = childrenAnalytics.reduce((sum, child) => sum + child.engagement_score, 0);
      const overallEngagement = childrenAnalytics.length > 0 ? totalEngagement / childrenAnalytics.length : 0;

      // Find most and least active children
      const mostActiveChild = childrenAnalytics.reduce((max, child) => 
        child.engagement_score > max.engagement_score ? child : max, childrenAnalytics[0] || null);
      const leastActiveChild = childrenAnalytics.reduce((min, child) => 
        child.engagement_score < min.engagement_score ? child : min, childrenAnalytics[0] || null);

      // Get weekly activity data
      let weeklyActivity = [];
      try {
        weeklyActivity = await this.getWeeklyActivity(children.map(c => c.id));
      } catch (error) {
        console.error('Error getting weekly activity:', error);
      }

      // Get monthly trends
      let monthlyTrends = [];
      try {
        monthlyTrends = await this.getMonthlyTrends(children.map(c => c.id));
      } catch (error) {
        console.error('Error getting monthly trends:', error);
      }

      return {
        total_children: children.length,
        total_chores_created: parentStats?.length || 0,
        total_stories_generated: storyStats?.length || 0,
        children_analytics: childrenAnalytics,
        overall_engagement: Math.round(overallEngagement),
        most_active_child: mostActiveChild?.child_name || '',
        least_active_child: leastActiveChild?.child_name || '',
        weekly_activity: weeklyActivity,
        monthly_trends: monthlyTrends,
      };
    } catch (error) {
      console.error('Error getting parent dashboard analytics:', error);
      return null;
    }
  }

  // Get detailed analytics for a specific child
  static async getChildAnalytics(childId: string): Promise<ChildAnalytics | null> {
    try {
      console.log('Getting analytics for child:', childId);
      
      // Get child basic info
      const { data: child, error: childError } = await supabase
        .from('children')
        .select('*')
        .eq('id', childId)
        .single();

      if (childError) {
        console.error('Error fetching child:', childError);
        return null;
      }

      if (!child) {
        console.log('Child not found:', childId);
        return null;
      }

      // Get chore completion stats
      const { data: choreCompletions } = await supabase
        .from('chore_completions')
        .select('status, completed_at, chores(points)')
        .eq('child_id', childId);

      const completed = choreCompletions?.filter(c => c.status === 'approved').length || 0;
      const pending = choreCompletions?.filter(c => c.status === 'pending').length || 0;
      const rejected = choreCompletions?.filter(c => c.status === 'rejected').length || 0;

      // Calculate average points per day (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentCompletions = choreCompletions?.filter(c => 
        c.status === 'approved' && 
        new Date(c.completed_at) >= thirtyDaysAgo
      ) || [];

      const totalPointsLast30Days = recentCompletions.reduce((sum, completion) => 
        sum + (completion.chores?.points || 0), 0);
      const averagePointsPerDay = Math.round(totalPointsLast30Days / 30);

      // Get story stats
      const { data: stories } = await supabase
        .from('story_chapters')
        .select('is_read, world_theme')
        .eq('child_id', childId);

      const chaptersRead = stories?.filter(s => s.is_read).length || 0;
      const storiesUnlocked = stories?.length || 0;

      // Get reading stats
      const readingStats = await ReadingProgressService.getReadingStats(childId);

      // Get achievement stats
      const achievementProgress = await AchievementService.getAchievementProgress(childId);

      // Get favorite world theme
      const worldThemeCounts: { [key: string]: number } = {};
      stories?.forEach(story => {
        if (story.world_theme) {
          worldThemeCounts[story.world_theme] = (worldThemeCounts[story.world_theme] || 0) + 1;
        }
      });
      const favoriteWorldTheme = Object.keys(worldThemeCounts).reduce((a, b) => 
        worldThemeCounts[a] > worldThemeCounts[b] ? a : b, '');

      // Get last activity
      const lastActivity = recentCompletions.length > 0 
        ? recentCompletions[0].completed_at 
        : child.created_at;

      // Calculate engagement score (0-100)
      const engagementScore = this.calculateEngagementScore({
        choresCompleted: completed,
        storiesRead: chaptersRead,
        currentStreak: child.current_streak,
        readingTime: readingStats?.total_reading_time || 0,
        achievements: achievementProgress?.unlocked_achievements || 0,
      });

      return {
        child_id: child.id,
        child_name: child.name,
        total_chores_completed: completed,
        total_chores_pending: pending,
        total_chores_rejected: rejected,
        current_streak: child.current_streak,
        longest_streak: child.current_streak, // TODO: Track longest streak separately
        total_points: child.total_points,
        average_points_per_day: averagePointsPerDay,
        stories_unlocked: storiesUnlocked,
        chapters_read: chaptersRead,
        reading_time_minutes: readingStats?.total_reading_time || 0,
        reading_speed_wpm: readingStats?.average_reading_speed || 0,
        reading_streak_days: readingStats?.reading_streak_days || 0,
        achievements_unlocked: achievementProgress?.unlocked_achievements || 0,
        total_achievements: achievementProgress?.total_achievements || 0,
        favorite_world_theme: favoriteWorldTheme,
        last_activity: lastActivity,
        engagement_score: engagementScore,
      };
    } catch (error) {
      console.error('Error getting child analytics:', error);
      return null;
    }
  }

  // Calculate engagement score based on various factors
  private static calculateEngagementScore(data: {
    choresCompleted: number;
    storiesRead: number;
    currentStreak: number;
    readingTime: number;
    achievements: number;
  }): number {
    let score = 0;

    // Chore completion (30% weight)
    score += Math.min(30, (data.choresCompleted / 10) * 30);

    // Story reading (25% weight)
    score += Math.min(25, (data.storiesRead / 5) * 25);

    // Current streak (20% weight)
    score += Math.min(20, (data.currentStreak / 7) * 20);

    // Reading time (15% weight)
    score += Math.min(15, (data.readingTime / 60) * 15);

    // Achievements (10% weight)
    score += Math.min(10, (data.achievements / 5) * 10);

    return Math.round(Math.min(100, score));
  }

  // Get weekly activity data
  private static async getWeeklyActivity(childIds: string[]): Promise<{
    date: string;
    chores_completed: number;
    stories_read: number;
    points_earned: number;
  }[]> {
    try {
      const weeklyData = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Get chores completed on this date
        const { data: chores } = await supabase
          .from('chore_completions')
          .select('chores(points)')
          .in('child_id', childIds)
          .eq('status', 'approved')
          .gte('completed_at', `${dateStr}T00:00:00`)
          .lt('completed_at', `${dateStr}T23:59:59`);

        // Get stories read on this date
        const { data: stories } = await supabase
          .from('story_chapters')
          .select('id')
          .in('child_id', childIds)
          .eq('is_read', true)
          .gte('created_at', `${dateStr}T00:00:00`)
          .lt('created_at', `${dateStr}T23:59:59`);

        const choresCompleted = chores?.length || 0;
        const storiesRead = stories?.length || 0;
        const pointsEarned = chores?.reduce((sum, c) => sum + (c.chores?.points || 0), 0) || 0;

        weeklyData.push({
          date: dateStr,
          chores_completed: choresCompleted,
          stories_read: storiesRead,
          points_earned: pointsEarned,
        });
      }

      return weeklyData;
    } catch (error) {
      console.error('Error getting weekly activity:', error);
      return [];
    }
  }

  // Get monthly trends
  private static async getMonthlyTrends(childIds: string[]): Promise<{
    month: string;
    chores_completed: number;
    stories_generated: number;
    average_engagement: number;
  }[]> {
    try {
      const monthlyData = [];
      const today = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStr = date.toISOString().substring(0, 7); // YYYY-MM format
        const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

        // Get chores completed in this month
        const { data: chores } = await supabase
          .from('chore_completions')
          .select('id')
          .in('child_id', childIds)
          .eq('status', 'approved')
          .gte('completed_at', date.toISOString())
          .lt('completed_at', nextMonth.toISOString());

        // Get stories generated in this month
        const { data: stories } = await supabase
          .from('story_chapters')
          .select('id')
          .in('child_id', childIds)
          .gte('created_at', date.toISOString())
          .lt('created_at', nextMonth.toISOString());

        monthlyData.push({
          month: monthStr,
          chores_completed: chores?.length || 0,
          stories_generated: stories?.length || 0,
          average_engagement: 75, // TODO: Calculate actual engagement for each month
        });
      }

      return monthlyData;
    } catch (error) {
      console.error('Error getting monthly trends:', error);
      return [];
    }
  }
}
