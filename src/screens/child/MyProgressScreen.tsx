import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { ReadingProgressService, ReadingStats } from '../../services/readingProgressService';
import { theme } from '../../utils/theme';

interface ProgressStats {
  totalChoresCompleted: number;
  totalChoresPending: number;
  totalChoresRejected: number;
  averagePointsPerDay: number;
  longestStreak: number;
  storiesUnlocked: number;
  rewardsRedeemed: number;
  readingStats: ReadingStats | null;
}

export default function MyProgressScreen() {
  const { currentChild } = useAuth();
  const [stats, setStats] = useState<ProgressStats>({
    totalChoresCompleted: 0,
    totalChoresPending: 0,
    totalChoresRejected: 0,
    averagePointsPerDay: 0,
    longestStreak: 0,
    storiesUnlocked: 0,
    rewardsRedeemed: 0,
    readingStats: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProgressStats = async () => {
    if (!currentChild?.id) return;

    try {
      // Fetch chore completion stats
      const { data: choreStats } = await supabase
        .from('chore_completions')
        .select('status')
        .eq('child_id', currentChild.id);

      const completed = choreStats?.filter(c => c.status === 'approved').length || 0;
      const pending = choreStats?.filter(c => c.status === 'pending').length || 0;
      const rejected = choreStats?.filter(c => c.status === 'rejected').length || 0;

      // Fetch stories unlocked
      const { data: stories } = await supabase
        .from('story_chapters')
        .select('id')
        .eq('child_id', currentChild.id);

      // Fetch rewards redeemed
      const { data: rewards } = await supabase
        .from('reward_redemptions')
        .select('id')
        .eq('child_id', currentChild.id)
        .eq('status', 'approved');

      // Calculate average points per day (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentCompletions } = await supabase
        .from('chore_completions')
        .select(`
          completed_at,
          chores (points)
        `)
        .eq('child_id', currentChild.id)
        .eq('status', 'approved')
        .gte('completed_at', thirtyDaysAgo.toISOString());

      const totalPointsLast30Days = recentCompletions?.reduce((sum, completion) => 
        sum + (completion.chores?.points || 0), 0) || 0;
      const averagePointsPerDay = Math.round(totalPointsLast30Days / 30);

      // Fetch reading statistics
      const readingStats = await ReadingProgressService.getReadingStats(currentChild.id);

      setStats({
        totalChoresCompleted: completed,
        totalChoresPending: pending,
        totalChoresRejected: rejected,
        averagePointsPerDay,
        longestStreak: currentChild.current_streak || 0,
        storiesUnlocked: stories?.length || 0,
        rewardsRedeemed: rewards?.length || 0,
        readingStats,
      });
    } catch (error) {
      console.error('Error fetching progress stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProgressStats();
    }, [currentChild?.id])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchProgressStats();
  };

  const getWorldThemeEmoji = (theme: string) => {
    switch (theme) {
      case 'magical_forest': return '🌲';
      case 'space_adventure': return '🚀';
      case 'underwater_kingdom': return '🐠';
      default: return '📚';
    }
  };

  const getAchievementLevel = (points: number) => {
    if (points >= 1000) return { level: 'Master Helper', emoji: '🏆', color: '#FFD700' };
    if (points >= 500) return { level: 'Super Helper', emoji: '⭐', color: '#FF9800' };
    if (points >= 250) return { level: 'Great Helper', emoji: '🌟', color: '#4CAF50' };
    if (points >= 100) return { level: 'Good Helper', emoji: '👍', color: '#2196F3' };
    return { level: 'Getting Started', emoji: '🌱', color: '#9E9E9E' };
  };

  const achievement = getAchievementLevel(currentChild?.total_points || 0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>My Progress</Text>
        
        {/* Achievement Level */}
        <View style={styles.achievementCard}>
          <View style={styles.achievementHeader}>
            <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
            <View style={styles.achievementText}>
              <Text style={styles.achievementLevel}>{achievement.level}</Text>
              <Text style={styles.achievementSubtext}>
                {currentChild?.total_points || 0} total points
              </Text>
            </View>
          </View>
          <View style={[styles.achievementBar, { backgroundColor: achievement.color }]}>
            <View style={[styles.achievementProgress, { 
              width: `${Math.min(100, ((currentChild?.total_points || 0) / 1000) * 100)}%`,
              backgroundColor: '#fff'
            }]} />
          </View>
        </View>

        {/* Main Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={styles.statNumber}>{stats.totalChoresCompleted}</Text>
            <Text style={styles.statLabel}>Chores Completed</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⏳</Text>
            <Text style={styles.statNumber}>{stats.totalChoresPending}</Text>
            <Text style={styles.statLabel}>Pending Approval</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNumber}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📚</Text>
            <Text style={styles.statNumber}>{stats.storiesUnlocked}</Text>
            <Text style={styles.statLabel}>Stories Unlocked</Text>
          </View>
        </View>

        {/* Reading Progress */}
        {stats.readingStats && (
          <View style={styles.readingProgressCard}>
            <Text style={styles.cardTitle}>📖 Reading Progress</Text>
            
            <View style={styles.readingStatsGrid}>
              <View style={styles.readingStatItem}>
                <Text style={styles.readingStatValue}>{stats.readingStats.total_reading_time}</Text>
                <Text style={styles.readingStatLabel}>Minutes Read</Text>
              </View>
              
              <View style={styles.readingStatItem}>
                <Text style={styles.readingStatValue}>{stats.readingStats.total_chapters_read}</Text>
                <Text style={styles.readingStatLabel}>Chapters Read</Text>
              </View>
              
              <View style={styles.readingStatItem}>
                <Text style={styles.readingStatValue}>{stats.readingStats.reading_streak_days}</Text>
                <Text style={styles.readingStatLabel}>Day Streak</Text>
              </View>
            </View>

            {stats.readingStats.average_reading_speed > 0 && (
              <View style={styles.readingSpeedContainer}>
                <Text style={styles.readingSpeedLabel}>Average Reading Speed:</Text>
                <Text style={styles.readingSpeedValue}>{stats.readingStats.average_reading_speed} WPM</Text>
              </View>
            )}

            {stats.readingStats.favorite_world_theme && (
              <View style={styles.favoriteWorldContainer}>
                <Text style={styles.favoriteWorldLabel}>Favorite World:</Text>
                <View style={styles.favoriteWorldInfo}>
                  <Text style={styles.favoriteWorldEmoji}>
                    {getWorldThemeEmoji(stats.readingStats.favorite_world_theme)}
                  </Text>
                  <Text style={styles.favoriteWorldText}>
                    {stats.readingStats.favorite_world_theme.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Detailed Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.cardTitle}>Your Journey</Text>
          
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Story World:</Text>
            <View style={styles.worldInfo}>
              <Text style={styles.worldEmoji}>
                {getWorldThemeEmoji(currentChild?.world_theme || '')}
              </Text>
              <Text style={styles.worldText}>
                {currentChild?.world_theme?.replace('_', ' ') || 'Not set'}
              </Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Average Points/Day:</Text>
            <Text style={styles.progressValue}>{stats.averagePointsPerDay}</Text>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Rewards Redeemed:</Text>
            <Text style={styles.progressValue}>{stats.rewardsRedeemed}</Text>
          </View>

          {stats.totalChoresRejected > 0 && (
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Chores to Retry:</Text>
              <Text style={[styles.progressValue, { color: theme.colors.error }]}>
                {stats.totalChoresRejected}
              </Text>
            </View>
          )}
        </View>

        {/* Motivational Message */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationTitle}>Keep Going! 🌟</Text>
          <Text style={styles.motivationText}>
            {stats.totalChoresCompleted === 0 
              ? "Start your first chore to begin your adventure!"
              : stats.totalChoresCompleted < 5
              ? "You're doing great! Keep completing chores to unlock more stories!"
              : stats.totalChoresCompleted < 20
              ? "Amazing progress! You're becoming a real helper!"
              : "You're a superstar! Your dedication is inspiring!"
            }
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: theme.spacing.lg,
    paddingTop: 100, // Added padding for header
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
  },
  achievementCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 16,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  achievementEmoji: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  achievementText: {
    flex: 1,
  },
  achievementLevel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  achievementSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  achievementBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  achievementProgress: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: theme.spacing.sm,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 12,
    marginBottom: theme.spacing.lg,
  },
  readingProgressCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 12,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  readingStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
  },
  readingStatItem: {
    alignItems: 'center',
  },
  readingStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  readingStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  readingSpeedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  readingSpeedLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  readingSpeedValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  favoriteWorldContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  favoriteWorldLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  favoriteWorldInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteWorldEmoji: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  favoriteWorldText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textTransform: 'capitalize',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  progressLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  worldInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  worldEmoji: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  worldText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textTransform: 'capitalize',
  },
  motivationCard: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: theme.spacing.sm,
  },
  motivationText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
});
