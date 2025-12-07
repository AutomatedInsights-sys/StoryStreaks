import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { aiStoryService } from '../../services/aiStoryService';
import { ReadingProgressService } from '../../services/readingProgressService';
import { StoryChapter } from '../../types';
import { theme } from '../../utils/theme';

export default function StoryReaderScreen({ route, navigation }: any) {
  const { chapterId } = route.params;
  const { currentChild } = useAuth();
  const [chapter, setChapter] = useState<StoryChapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Reading progress tracking
  const [readingSessionId, setReadingSessionId] = useState<string | null>(null);
  const [readingStats, setReadingStats] = useState<{
    totalSessions: number;
    totalTime: number;
    averageSpeed: number;
  } | null>(null);
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null);

  const fetchChapter = async () => {
    if (!chapterId || !currentChild) return;

    try {
      const { data, error } = await supabase
        .from('story_chapters')
        .select('*')
        .eq('id', chapterId)
        .eq('child_id', currentChild.id)
        .single();

      if (error) {
        console.error('Error fetching chapter:', error);
        Alert.alert('Error', 'Failed to load story chapter');
        return;
      }

      setChapter(data);
      
      // Start reading session
      await startReadingSession();
      
      // Get reading stats for this chapter
      const stats = await ReadingProgressService.getChapterReadingProgress(chapterId);
      setReadingStats(stats);
    } catch (error) {
      console.error('Error fetching chapter:', error);
      Alert.alert('Error', 'Failed to load story chapter');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const startReadingSession = async () => {
    if (!currentChild || !chapterId) return;

    try {
      const session = await ReadingProgressService.startReadingSession(currentChild.id, chapterId);
      if (session) {
        setReadingSessionId(session.id);
        setReadingStartTime(new Date());
      }
    } catch (error) {
      console.error('Error starting reading session:', error);
    }
  };

  const endReadingSession = async () => {
    if (!readingSessionId || !chapter) return;

    try {
      const wordsRead = chapter.content.split(' ').length;
      await ReadingProgressService.endReadingSession(readingSessionId, wordsRead);
      
      // Update reading stats
      const stats = await ReadingProgressService.getChapterReadingProgress(chapterId);
      setReadingStats(stats);
    } catch (error) {
      console.error('Error ending reading session:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChapter();
      
      // Cleanup function to end reading session when leaving
      return () => {
        if (readingSessionId) {
          endReadingSession();
        }
      };
    }, [chapterId, currentChild])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchChapter();
  };

  const markAsRead = async () => {
    if (!chapter) return;

    try {
      // End reading session first
      await endReadingSession();

      const { error } = await supabase
        .from('story_chapters')
        .update({ is_read: true })
        .eq('id', chapter.id);

      if (error) {
        console.error('Error marking chapter as read:', error);
        return;
      }

      setChapter(prev => prev ? { ...prev, is_read: true } : null);
      
      // Show completion celebration
      Alert.alert(
        '🎉 Chapter Complete!',
        'Great job reading this chapter! Keep up the amazing work!',
        [{ text: 'Continue Reading', style: 'default' }]
      );
    } catch (error) {
      console.error('Error marking chapter as read:', error);
    }
  };

  const generateNewChapter = async () => {
    if (!currentChild) return;

    setIsGenerating(true);
    try {
      // Get recent completed chores
      const { data: recentCompletions } = await supabase
        .from('chore_completions')
        .select(`
          id,
          chores (title)
        `)
        .eq('child_id', currentChild.id)
        .eq('status', 'approved')
        .order('completed_at', { ascending: false })
        .limit(5);

      const completedChoreIds = recentCompletions?.map(c => c.id) || [];
      
      if (completedChoreIds.length === 0) {
        Alert.alert(
          'No New Chapters Yet',
          'Complete some chores to unlock new story chapters!',
          [{ text: 'OK' }]
        );
        return;
      }

      const newChapter = await aiStoryService.unlockStoryForChores(
        currentChild.id,
        completedChoreIds
      );

      if (newChapter) {
        Alert.alert(
          'New Chapter Unlocked! 🎉',
          `"${newChapter.title}" is ready to read!`,
          [
            {
              text: 'Read Now',
              onPress: () => {
                setChapter(newChapter);
                navigation.setParams({ chapterId: newChapter.id });
              },
            },
            { text: 'Later', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert(
          'Unable to Generate',
          'Sorry, we couldn\'t generate a new chapter right now. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error generating new chapter:', error);
      Alert.alert('Error', 'Failed to generate new chapter');
    } finally {
      setIsGenerating(false);
    }
  };

  const getWorldThemeEmoji = (theme: string) => {
    switch (theme) {
      case 'magical_forest': return '🌲';
      case 'space_adventure': return '🚀';
      case 'underwater_kingdom': return '🐠';
      default: return '📚';
    }
  };

  const getWorldThemeColor = (theme: string) => {
    switch (theme) {
      case 'magical_forest': return '#4CAF50';
      case 'space_adventure': return '#2196F3';
      case 'underwater_kingdom': return '#00BCD4';
      default: return theme.colors.primary;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your story...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chapter) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>📚 Story Not Found</Text>
          <Text style={styles.errorText}>
            This story chapter couldn't be found or you don't have access to it.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
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
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.worldEmoji}>
              {getWorldThemeEmoji(chapter.world_theme)}
            </Text>
            <View style={styles.titleTextContainer}>
              <Text style={styles.chapterNumber}>Chapter {chapter.chapter_number}</Text>
              <Text style={styles.chapterTitle}>{chapter.title}</Text>
            </View>
          </View>
          
          <View style={styles.metaContainer}>
            <View style={[
              styles.worldBadge,
              { backgroundColor: getWorldThemeColor(chapter.world_theme) }
            ]}>
              <Text style={styles.worldBadgeText}>
                {chapter.world_theme.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            {!chapter.is_read && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>NEW</Text>
              </View>
            )}
          </View>
        </View>

        {/* Reading Progress Stats */}
        {readingStats && readingStats.totalSessions > 0 && (
          <View style={styles.readingStatsContainer}>
            <Text style={styles.readingStatsTitle}>📊 Your Reading Progress</Text>
            <View style={styles.readingStatsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{readingStats.totalSessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{readingStats.totalTime}m</Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{readingStats.averageSpeed}</Text>
                <Text style={styles.statLabel}>WPM</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.storyContent}>{chapter.content}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Unlocked on {new Date(chapter.unlocked_at).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        {!chapter.is_read && (
          <TouchableOpacity
            style={styles.markReadButton}
            onPress={markAsRead}
          >
            <Text style={styles.markReadText}>✓ Mark as Read</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.generateButton,
            isGenerating && styles.generateButtonDisabled
          ]}
          onPress={generateNewChapter}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.generateText}>✨ Generate New Chapter</Text>
          )}
        </TouchableOpacity>
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: 20,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl * 2,
  },
  errorTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    letterSpacing: -0.5,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: theme.spacing.xl,
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Warm storybook header with firelight glow
  header: {
    padding: theme.spacing.xl,
    backgroundColor: 'rgba(255, 179, 71, 0.08)',
    borderBottomWidth: 0,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  worldEmoji: {
    fontSize: 64,
    marginRight: theme.spacing.lg,
    marginTop: -8,
  },
  titleTextContainer: {
    flex: 1,
  },
  chapterNumber: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  chapterTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.text,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  worldBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 2,
  },
  worldBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  unreadBadge: {
    backgroundColor: '#00C9FF',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
    shadowColor: '#00C9FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  readingStatsContainer: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.15)',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  readingStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  readingStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  // Warm firelight reading experience - cozy and immersive
  content: {
    padding: theme.spacing.xl * 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.xl,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.1)',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  storyContent: {
    fontSize: 22,
    lineHeight: 38,
    color: theme.colors.text,
    textAlign: 'left',
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  footer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  // Warm action buttons with firelight glow
  bottomActions: {
    flexDirection: 'row',
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 140, 66, 0.1)',
    backgroundColor: theme.colors.background,
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  markReadButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  markReadText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  generateButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
