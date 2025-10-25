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
      
      // Check if there's a new unread story to celebrate
      if (newStories.length > 0 && availableStories.length > 0) {
        const latestStory = newStories[0];
        const previousLatestStory = availableStories[0];
        
        // If we have a new story that wasn't there before, show celebration
        if (latestStory.id !== previousLatestStory?.id && !latestStory.is_read) {
          setCelebrationChapter(latestStory);
          setShowCelebration(true);
        }
      } else if (newStories.length > 0 && availableStories.length === 0) {
        // First story ever - show celebration
        const latestStory = newStories[0];
        if (!latestStory.is_read) {
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
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.xl,
  },
  statBox: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  todaySection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: theme.spacing.lg,
  },
  choresList: {
    gap: theme.spacing.md,
  },
  choreCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  choreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  choreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  pointsBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
  },
  pointsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  choreDescription: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  choreFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recurrenceText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  tapToComplete: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  storiesSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 12,
    marginTop: theme.spacing.lg,
  },
  storiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  viewAllButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  storiesList: {
    gap: theme.spacing.md,
  },
  storyCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  storyEmoji: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  storyContent: {
    flex: 1,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  storyPreview: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  newBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
    marginLeft: theme.spacing.sm,
  },
  newText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
