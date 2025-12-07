import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { Chore, StoryChapter } from '../../types';
import { theme } from '../../utils/theme';
import StoryUnlockCelebration from '../../components/shared/StoryUnlockCelebration';

export default function ChildHomeScreen({ navigation }: any) {
  const { currentChild } = useAuth();
  const [assignedChores, setAssignedChores] = useState<Chore[]>([]);
  const [availableStories, setAvailableStories] = useState<StoryChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Celebration modal state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationChapter, setCelebrationChapter] = useState<StoryChapter | null>(null);

  const fetchAssignedChores = async () => {
    if (!currentChild?.id) return;

    try {
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .contains('assigned_to', [currentChild.id])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assigned chores:', error);
        return;
      }

      setAssignedChores(data || []);
    } catch (error) {
      console.error('Error fetching assigned chores:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchAvailableStories = async () => {
    if (!currentChild?.id) return;

    try {
      const { data, error } = await supabase
        .from('story_chapters')
        .select('*')
        .eq('child_id', currentChild.id)
        .order('chapter_number', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching stories:', error);
        return;
      }

      const newStories = data || [];

      // Only show celebration for stories unlocked in the last 5 minutes
      if (newStories.length > 0) {
        const latestStory = newStories[0];
        const unlockedAt = new Date(latestStory.unlocked_at);
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        // Show celebration if story was just unlocked and hasn't been read yet
        const isRecentlyUnlocked = unlockedAt > fiveMinutesAgo;
        const isNewStory = availableStories.length === 0 || latestStory.id !== availableStories[0]?.id;

        if (isRecentlyUnlocked && !latestStory.is_read && isNewStory) {
          setCelebrationChapter(latestStory);
          setShowCelebration(true);
        }
      }

      setAvailableStories(newStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAssignedChores();
      fetchAvailableStories();
    }, [currentChild?.id])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAssignedChores();
    fetchAvailableStories();
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    setCelebrationChapter(null);
  };

  const handleReadNow = () => {
    if (celebrationChapter) {
      setShowCelebration(false);
      navigation.navigate('StoryReader', { chapterId: celebrationChapter.id });
      setCelebrationChapter(null);
    }
  };

  const renderChoreCard = (chore: Chore) => (
    <TouchableOpacity
      key={chore.id}
      style={styles.choreCard}
      onPress={() => navigation.navigate('ChoreDetail', { choreId: chore.id })}
    >
      <View style={styles.choreHeader}>
        <Text style={styles.choreTitle}>{chore.title}</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{chore.points} pts</Text>
        </View>
      </View>
      <Text style={styles.choreDescription}>{chore.description}</Text>
      <View style={styles.choreFooter}>
        <Text style={styles.recurrenceText}>
          {chore.recurrence === 'daily' ? 'Daily' : 
           chore.recurrence === 'weekly' ? 'Weekly' : 'One-time'}
        </Text>
        <Text style={styles.tapToComplete}>Tap to complete →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Hello, {currentChild?.name || 'Friend'}!</Text>
        <Text style={styles.subtitle}>Ready for today's adventures?</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{currentChild?.current_streak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{currentChild?.total_points || 0}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
        </View>

        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>Your Chores</Text>
          {assignedChores.length === 0 ? (
            <Text style={styles.emptyText}>No chores assigned yet! 🎉</Text>
          ) : (
            <View style={styles.choresList}>
              {assignedChores.map(renderChoreCard)}
            </View>
          )}
        </View>

        {availableStories.length > 0 && (
          <View style={styles.storiesSection}>
            <View style={styles.storiesHeader}>
              <Text style={styles.sectionTitle}>Latest Stories</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('StoriesList')}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.storiesList}>
              {availableStories.slice(0, 2).map((story) => (
                <TouchableOpacity
                  key={story.id}
                  style={styles.storyCard}
                  onPress={() => navigation.navigate('StoryReader', { chapterId: story.id })}
                >
                  <Text style={styles.storyEmoji}>
                    {story.world_theme === 'magical_forest' ? '🌲' : 
                     story.world_theme === 'space_adventure' ? '🚀' : '🐠'}
                  </Text>
                  <View style={styles.storyContent}>
                    <Text style={styles.storyTitle}>{story.title}</Text>
                    <Text style={styles.storyPreview} numberOfLines={2}>
                      {story.content.substring(0, 80)}...
                    </Text>
                  </View>
                  {!story.is_read && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newText}>NEW</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Story Unlock Celebration Modal */}
      {celebrationChapter && (
        <StoryUnlockCelebration
          visible={showCelebration}
          chapterTitle={celebrationChapter.title}
          chapterNumber={celebrationChapter.chapter_number}
          worldTheme={celebrationChapter.world_theme}
          onClose={handleCelebrationClose}
          onReadNow={handleReadNow}
        />
      )}
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
  },
  // Hero welcome section with magical gradient overlay
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.5,
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  subtitle: {
    fontSize: 20,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    fontWeight: '500',
    paddingHorizontal: theme.spacing.lg,
  },
  // Warm stat cards with phoenix orange glow
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.1)',
  },
  statNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FF8C42',
    marginBottom: theme.spacing.xs,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Organic section containers with depth
  todaySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: theme.spacing.xl,
    borderRadius: 32,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(108, 92, 231, 0.08)',
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: theme.spacing.xl,
    fontWeight: '500',
  },
  choresList: {
    gap: theme.spacing.lg,
  },
  // Playful chore cards with shadows and hover states
  choreCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: theme.spacing.xl,
    borderWidth: 0,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderLeftWidth: 6,
    borderLeftColor: theme.colors.primary,
  },
  choreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  choreTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.md,
    letterSpacing: -0.2,
  },
  pointsBadge: {
    backgroundColor: '#FFB347',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    shadowColor: '#FFB347',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  pointsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  choreDescription: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
    opacity: 0.8,
  },
  choreFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(108, 92, 231, 0.1)',
  },
  recurrenceText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  tapToComplete: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  // Story section with soft sky blue background
  storiesSection: {
    backgroundColor: 'rgba(184, 230, 245, 0.3)',
    padding: theme.spacing.xl,
    borderRadius: 20,
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(79, 172, 254, 0.15)',
  },
  storiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  viewAllButton: {
    backgroundColor: '#4FACFE',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    shadowColor: '#4FACFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  storiesList: {
    gap: theme.spacing.lg,
  },
  // Whimsical story cards with sky blue accents
  storyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(79, 172, 254, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  storyEmoji: {
    fontSize: 40,
    marginRight: theme.spacing.lg,
  },
  storyContent: {
    flex: 1,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.2,
  },
  storyPreview: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    opacity: 0.8,
  },
  newBadge: {
    backgroundColor: '#00C9FF',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    marginLeft: theme.spacing.md,
    shadowColor: '#00C9FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  newText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
