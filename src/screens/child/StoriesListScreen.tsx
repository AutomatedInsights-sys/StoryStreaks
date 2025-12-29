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
import { StoryChapter, StoryBook, StoryWorld } from '../../types';
import { theme } from '../../utils/theme';
import ThemeSelectionModal from '../../components/shared/ThemeSelectionModal';

export default function StoriesListScreen({ navigation, route }: any) {
  const { currentChild } = useAuth();
  const [chapters, setChapters] = useState<StoryChapter[]>([]);
  const [activeBook, setActiveBook] = useState<StoryBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStartingBook, setIsStartingBook] = useState(false);
  const [showThemeSelection, setShowThemeSelection] = useState(false);

  // Get bookId from route params if passed (when clicking a specific book)
  const specificBookId = route?.params?.bookId;

  const fetchData = async () => {
    if (!currentChild?.id) return;

    try {
      let book: StoryBook | null = null;

      // If a specific book ID was passed, fetch that book
      if (specificBookId) {
        const { data: specificBook } = await supabase
          .from('story_books')
          .select('*')
          .eq('id', specificBookId)
          .single();
        book = specificBook;
      } else {
        // Otherwise, fetch the active book
        const { data: activeBookData } = await supabase
          .from('story_books')
          .select('*')
          .eq('child_id', currentChild.id)
          .eq('status', 'active')
          .single();
        book = activeBookData;
      }
      
      setActiveBook(book);

      // 2. Fetch Chapters for the selected book
      let query = supabase
        .from('story_chapters')
        .select('*')
        .eq('child_id', currentChild.id);

      if (book) {
        query = query.or(
          `story_book_id.eq.${book.id},and(story_book_id.is.null,world_theme.eq.${book.theme})`
        );
      } else {
        // If no book found, show all chapters (legacy + completed books)
      }

      query = query.order('chapter_number', { ascending: true });

      const { data: chaptersData, error } = await query;

      if (error) {
        console.error('Error fetching chapters:', error);
        Alert.alert('Error', 'Failed to load stories');
        return;
      }

      setChapters(chaptersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load stories');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [currentChild?.id, specificBookId])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleStartBook = () => {
    if (!currentChild) return;
    // Show theme selection modal instead of automatically using the child's current theme
    setShowThemeSelection(true);
  };

  const handleThemeSelection = async (selectedTheme: StoryWorld) => {
    if (!currentChild) return;
    
    setIsStartingBook(true);
    try {
      const book = await aiStoryService.startNewBook(currentChild.id, selectedTheme);
      if (book) {
        setShowThemeSelection(false);
        Alert.alert('New Adventure Started!', `"${book.title}" is ready. Complete chores to unlock Chapter 1!`);
        fetchData();
      } else {
        Alert.alert('Error', 'Could not start a new book. Please try again.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to start book');
    } finally {
      setIsStartingBook(false);
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

  const renderBookHeader = () => {
    if (!activeBook) return null;
    
    // Use activeBook.current_chapter for display (authoritative source)
    // but also verify against actual chapters to catch any inconsistencies
    const actualChapterCount = chapters.length;
    const bookChapterCount = activeBook.current_chapter || 0;
    // Use the higher of the two to ensure we show the correct count
    // (book.current_chapter is updated when chapter is generated)
    const unlockedCount = Math.max(actualChapterCount, bookChapterCount);
    const total = activeBook.total_chapters;
    const progress = Math.min(unlockedCount / total, 1);
    
    return (
      <View style={styles.bookHeader}>
        <View style={styles.bookHeaderTop}>
          <Text style={styles.bookEmoji}>{getWorldThemeEmoji(activeBook.theme)}</Text>
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle}>{activeBook.title}</Text>
            <Text style={styles.bookStatus}>
              Chapter {unlockedCount} of {total}
            </Text>
          </View>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
      </View>
    );
  };

  const renderStartBookButton = () => (
    <View style={styles.startBookContainer}>
      <Text style={styles.startBookTitle}>Ready for a new adventure?</Text>
      <Text style={styles.startBookSubtitle}>Start a new book in the {currentChild?.world_theme ? currentChild.world_theme.replace('_', ' ') : 'magical world'}!</Text>
      <TouchableOpacity 
        style={styles.startBookButton}
        onPress={handleStartBook}
        disabled={isStartingBook}
      >
        {isStartingBook ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.startBookButtonText}>✨ Start New Book</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderChapterCard = (chapter: StoryChapter) => (
    <TouchableOpacity
      key={chapter.id}
      style={styles.chapterCard}
      onPress={() => navigation.navigate('StoryReader', { chapterId: chapter.id })}
    >
      {/* Premium Cover Image or Fallback Emoji */}
      {chapter.image_url ? (
        <View style={styles.chapterCoverContainer}>
          <Image 
            source={{ uri: chapter.image_url }} 
            style={styles.chapterCoverImage}
            resizeMode="cover"
          />
          {!chapter.is_read && (
            <View style={styles.newBadgeOverlay}>
              <Text style={styles.newText}>NEW</Text>
            </View>
          )}
        </View>
      ) : (
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
      )}
      
      {/* Title below image if we have a cover */}
      {chapter.image_url && (
        <View style={styles.chapterInfoBelowImage}>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
          <Text style={styles.chapterNumber}>Chapter {chapter.chapter_number}</Text>
        </View>
      )}
      
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
        {renderBookHeader()}

        {(!activeBook && chapters.length === 0) ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>📚 No stories yet</Text>
            <Text style={styles.emptyText}>
              Start a new book to begin your adventure!
            </Text>
            <TouchableOpacity 
              style={styles.startBookButton}
              onPress={handleStartBook}
              disabled={isStartingBook}
            >
               {isStartingBook ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.startBookButtonText}>✨ Start New Book</Text>
                )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.chaptersList}>
            {!activeBook && renderStartBookButton()}
            {chapters.map(renderChapterCard)}
          </View>
        )}
      </ScrollView>

      {/* Theme Selection Modal for new story book */}
      <ThemeSelectionModal
        visible={showThemeSelection}
        childName={currentChild?.name || ''}
        onSelectTheme={handleThemeSelection}
        onClose={() => setShowThemeSelection(false)}
        isLoading={isStartingBook}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // Twilight sky header with soft blue glow
  header: {
    padding: theme.spacing.xl,
    paddingTop: 100, // Added top padding for transparent header
    backgroundColor: 'rgba(184, 230, 245, 0.3)',
    borderBottomWidth: 0,
    borderBottomColor: 'rgba(79, 172, 254, 0.15)',
  },
  bookHeader: {
    margin: theme.spacing.xl,
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  bookHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  bookEmoji: {
    fontSize: 40,
    marginRight: theme.spacing.lg,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  bookStatus: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
  },
  startBookContainer: {
    padding: theme.spacing.xl,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  startBookTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  startBookSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  startBookButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 999,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startBookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    lineHeight: 26,
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
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
  },
  // Storybook library layout for chapters
  chaptersList: {
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  // Magical storybook chapter cards with sky blue glow
  chapterCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(79, 172, 254, 0.2)',
    shadowColor: '#4FACFE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden',
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  chapterEmoji: {
    fontSize: 56,
    marginRight: theme.spacing.lg,
    marginTop: -8,
  },
  chapterTitleContainer: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  chapterNumber: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  newBadge: {
    backgroundColor: '#00C9FF',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    shadowColor: '#00C9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  newText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  // Premium cover image styles
  chapterCoverContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  chapterCoverImage: {
    width: '100%',
    height: '100%',
  },
  newBadgeOverlay: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: '#00C9FF',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    shadowColor: '#00C9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  chapterInfoBelowImage: {
    marginBottom: theme.spacing.md,
  },
  chapterPreview: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 26,
    marginBottom: theme.spacing.lg,
    opacity: 0.75,
  },
  chapterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 172, 254, 0.2)',
  },
  unlockedDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  readStatus: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '800',
  },
});
