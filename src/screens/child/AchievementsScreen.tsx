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
import { AchievementService, Achievement, AchievementProgress } from '../../services/achievementService';
import { theme } from '../../utils/theme';

export default function AchievementsScreen() {
  const { currentChild } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAchievements = async () => {
    if (!currentChild?.id) return;

    try {
      const [achievementsData, progressData] = await Promise.all([
        AchievementService.getAchievements(currentChild.id),
        AchievementService.getAchievementProgress(currentChild.id),
      ]);

      setAchievements(achievementsData);
      setProgress(progressData);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAchievements();
    }, [currentChild?.id])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAchievements();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'chores': return '#4CAF50';
      case 'reading': return '#2196F3';
      case 'streak': return '#FF9800';
      case 'special': return '#9C27B0';
      default: return theme.colors.primary;
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'chores': return '🧹';
      case 'reading': return '📚';
      case 'streak': return '🔥';
      case 'special': return '⭐';
      default: return '🏆';
    }
  };

  const getFilteredAchievements = () => {
    if (selectedCategory === 'all') {
      return achievements;
    }
    return achievements.filter(a => a.category === selectedCategory);
  };

  const renderAchievementCard = (achievement: Achievement) => (
    <View
      key={achievement.id}
      style={[
        styles.achievementCard,
        achievement.is_unlocked && styles.unlockedCard,
        { borderLeftColor: getCategoryColor(achievement.category) }
      ]}
    >
      <View style={styles.achievementHeader}>
        <View style={[
          styles.achievementIcon,
          { backgroundColor: getCategoryColor(achievement.category) }
        ]}>
          <Text style={styles.achievementIconText}>{achievement.icon}</Text>
        </View>
        
        <View style={styles.achievementInfo}>
          <Text style={[
            styles.achievementTitle,
            !achievement.is_unlocked && styles.lockedText
          ]}>
            {achievement.title}
          </Text>
          <Text style={[
            styles.achievementDescription,
            !achievement.is_unlocked && styles.lockedText
          ]}>
            {achievement.description}
          </Text>
        </View>

        {achievement.is_unlocked ? (
          <View style={styles.unlockedBadge}>
            <Text style={styles.unlockedText}>✓</Text>
          </View>
        ) : (
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedText}>🔒</Text>
          </View>
        )}
      </View>

      <View style={styles.achievementFooter}>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryEmoji}>
            {getCategoryEmoji(achievement.category)}
          </Text>
          <Text style={styles.categoryText}>
            {achievement.category.toUpperCase()}
          </Text>
        </View>

        <View style={styles.pointsContainer}>
          <Text style={styles.pointsText}>+{achievement.points_reward} pts</Text>
        </View>
      </View>

      {/* Progress Bar */}
      {!achievement.is_unlocked && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${achievement.progress}%`,
                  backgroundColor: getCategoryColor(achievement.category)
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>{achievement.progress}%</Text>
        </View>
      )}
    </View>
  );

  const categories = [
    { key: 'all', label: 'All', emoji: '🏆' },
    { key: 'chores', label: 'Chores', emoji: '🧹' },
    { key: 'reading', label: 'Reading', emoji: '📚' },
    { key: 'streak', label: 'Streak', emoji: '🔥' },
    { key: 'special', label: 'Special', emoji: '⭐' },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.mainScrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Achievements</Text>
          {progress && (
            <Text style={styles.subtitle}>
              {progress.unlocked_achievements} of {progress.total_achievements} unlocked
            </Text>
          )}
        </View>

        {/* Compact Progress Overview */}
        {progress && (
          <View style={styles.progressOverview}>
            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatValue}>{progress.unlocked_achievements}</Text>
                <Text style={styles.progressStatLabel}>Unlocked</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatValue}>{progress.total_points_earned}</Text>
                <Text style={styles.progressStatLabel}>Points</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatValue}>
                  {Math.round((progress.unlocked_achievements / progress.total_achievements) * 100)}%
                </Text>
                <Text style={styles.progressStatLabel}>Complete</Text>
              </View>
            </View>
          </View>
        )}

        {/* Compact Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContent}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                selectedCategory === category.key && styles.selectedCategoryButton
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <Text style={styles.categoryButtonEmoji}>{category.emoji}</Text>
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category.key && styles.selectedCategoryButtonText
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Achievements List */}
        <View style={styles.achievementsList}>
          {getFilteredAchievements().map(renderAchievementCard)}
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
  mainScrollView: {
    flex: 1,
  },
  // Compact magical header
  header: {
    padding: theme.spacing.xl,
    paddingTop: 100, // Added padding for header
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  // Magical progress overview with warm glow
  progressOverview: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.15)',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    letterSpacing: -0.5,
  },
  progressStatLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  // Compact category filter
  categoryFilter: {
    maxHeight: 50,
    marginBottom: theme.spacing.lg,
  },
  categoryFilterContent: {
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 66, 0.2)',
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCategoryButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  categoryButtonEmoji: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  categoryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 0.2,
  },
  selectedCategoryButtonText: {
    color: '#fff',
  },
  achievementsList: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  // Magical achievement cards with warm glow
  achievementCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: theme.spacing.xl,
    borderLeftWidth: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.1)',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  unlockedCard: {
    borderLeftColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  achievementIconText: {
    fontSize: 32,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  achievementDescription: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    fontWeight: '500',
  },
  lockedText: {
    opacity: 0.5,
  },
  unlockedBadge: {
    backgroundColor: theme.colors.success,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  unlockedText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  lockedBadge: {
    backgroundColor: theme.colors.border,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 20,
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 140, 66, 0.15)',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 140, 66, 0.1)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
  },
  categoryEmoji: {
    fontSize: 14,
    marginRight: theme.spacing.xs,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  pointsContainer: {
    backgroundColor: '#FFB347',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    shadowColor: '#FFB347',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  pointsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 140, 66, 0.2)',
    borderRadius: 999,
    marginRight: theme.spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'right',
  },
});
