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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { StoryChapter } from '../../types';
import { theme } from '../../utils/theme';

export default function StoriesListScreen({ navigation }: any) {
  const { currentChild } = useAuth();
  const [chapters, setChapters] = useState<StoryChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchChapters = async () => {
    if (!currentChild?.id) return;

    try {
      const { data, error } = await supabase
        .from('story_chapters')
        .select('*')
        .eq('child_id', currentChild.id)
        .order('chapter_number', { ascending: true });

      if (error) {
        console.error('Error fetching chapters:', error);
        Alert.alert('Error', 'Failed to load stories');
        return;
      }

      setChapters(data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      Alert.alert('Error', 'Failed to load stories');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChapters();
    }, [currentChild?.id])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchChapters();
  };

  const getWorldThemeEmoji = (theme: string) => {
    switch (theme) {
      case 'magical_forest': return '🌲';
      case 'space_adventure': return '🚀';
      case 'underwater_kingdom': return '🐠';
      default: return '📚';
    }
  };

  const renderChapterCard = (chapter: StoryChapter) => (
    <TouchableOpacity
      key={chapter.id}
      style={styles.chapterCard}
      onPress={() => navigation.navigate('StoryReader', { chapterId: chapter.id })}
    >
      <View style={styles.chapterHeader}>
        <Text style={styles.chapterEmoji}>
          {getWorldThemeEmoji(chapter.world_theme)}
        </Text>
        <View style={styles.chapterTitleContainer}>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
          <Text style={styles.chapterNumber}>Chapter {chapter.chapter_number}</Text>
        </View>
        {!chapter.is_read && (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>NEW</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.chapterPreview} numberOfLines={2}>
        {chapter.content.substring(0, 100)}...
      </Text>
      
      <View style={styles.chapterFooter}>
        <Text style={styles.unlockedDate}>
          Unlocked {new Date(chapter.unlocked_at).toLocaleDateString()}
        </Text>
        <Text style={styles.readStatus}>
          {chapter.is_read ? '✓ Read' : '📖 Read Now'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your stories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Stories</Text>
        <Text style={styles.subtitle}>
          Complete chores to unlock new chapters!
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {chapters.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>📚 No stories yet</Text>
            <Text style={styles.emptyText}>
              Complete some chores to unlock your first story chapter!
            </Text>
          </View>
        ) : (
          <View style={styles.chaptersList}>
            {chapters.map(renderChapterCard)}
          </View>
        )}
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
  scrollView: {
    flex: 1,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  chaptersList: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  chapterCard: {
    backgroundColor: theme.colors.surface,
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
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  chapterEmoji: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  chapterTitleContainer: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  chapterNumber: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  newBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
  },
  newText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chapterPreview: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  chapterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unlockedDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  readStatus: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});
