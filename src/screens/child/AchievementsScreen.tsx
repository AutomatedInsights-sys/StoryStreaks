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
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        {progress && (
          <Text style={styles.subtitle}>
            {progress.unlocked_achievements} of {progress.total_achievements} unlocked
          </Text>
        )}
      </View>

      {/* Progress Overview */}
      {progress && (
        <View style={styles.progressOverview}>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{progress.unlocked_achievements}</Text>
              <Text style={styles.progressStatLabel}>Unlocked</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{progress.total_points_earned}</Text>
              <Text style={styles.progressStatLabel}>Points Earned</Text>
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

      {/* Category Filter */}
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

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
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
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
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
  progressOverview: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  progressStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  categoryFilter: {
    marginBottom: theme.spacing.lg,
  },
  categoryFilterContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedCategoryButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryButtonEmoji: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  selectedCategoryButtonText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  achievementsList: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  achievementCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unlockedCard: {
    borderColor: theme.colors.primary,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  achievementIconText: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  achievementDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  lockedText: {
    opacity: 0.6,
  },
  unlockedBadge: {
    backgroundColor: theme.colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lockedBadge: {
    backgroundColor: theme.colors.border,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 16,
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
  },
  categoryEmoji: {
    fontSize: 12,
    marginRight: theme.spacing.xs,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  pointsContainer: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
  },
  pointsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    marginRight: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
    minWidth: 35,
    textAlign: 'right',
  },
});
