import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  Dimensions,
  FlatList,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { Chore, ChoreCompletion, StoryBook, StoryChapter } from '../../types';
import { theme } from '../../utils/theme';
import StoryUnlockCelebration from '../../components/shared/StoryUnlockCelebration';

const { width } = Dimensions.get('window');

// Helper function to get the start of today (midnight local time)
const getStartOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// Helper function to get the start of the current week (Monday)
const getStartOfWeek = (): Date => {
  const now = new Date();
  const day = now.getDay();
  // Adjust so Monday is the first day of the week (day 1)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff);
};

// Helper function to check if a chore is already completed for the current period
const isChoreCompletedForPeriod = (
  chore: Chore, 
  completions: ChoreCompletion[]
): boolean => {
  // Get completions for this chore that are pending or approved (rejected can be retried)
  const choreCompletions = completions.filter(
    c => c.chore_id === chore.id && (c.status === 'pending' || c.status === 'approved')
  );

  if (choreCompletions.length === 0) return false;

  switch (chore.recurrence) {
    case 'one-time':
      // One-time chores are done once they have any pending/approved completion
      return true;

    case 'daily':
      // Daily chores reset at midnight
      const startOfToday = getStartOfToday();
      return choreCompletions.some(c => new Date(c.completed_at) >= startOfToday);

    case 'weekly':
      // Weekly chores reset at the start of the week (Monday)
      const startOfWeek = getStartOfWeek();
      return choreCompletions.some(c => new Date(c.completed_at) >= startOfWeek);

    default:
      return false;
  }
};

// Category definitions for the filter
const CATEGORIES = [
  { id: 'all', label: 'All', theme: null },
  { id: 'magical', label: 'Magical', theme: 'magical_forest' },
  { id: 'adventure', label: 'Space', theme: 'space_adventure' },
  { id: 'ocean', label: 'Ocean', theme: 'underwater_kingdom' },
];

export default function ChildHomeScreen({ navigation }: any) {
  const { currentChild } = useAuth();
  const [assignedChores, setAssignedChores] = useState<Chore[]>([]);
  const [books, setBooks] = useState<StoryBook[]>([]);
  const [recentChapters, setRecentChapters] = useState<StoryChapter[]>([]); // Fallback if no books
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Celebration modal state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationChapter, setCelebrationChapter] = useState<StoryChapter | null>(null);
  const celebratedChaptersRef = useRef<Set<string>>(new Set());

  const fetchData = async () => {
    if (!currentChild?.id) return;

    try {
      // 1. Fetch Assigned Chores
      const { data: choresData, error: choresError } = await supabase
        .from('chores')
        .select('*')
        .contains('assigned_to', [currentChild.id])
        .order('created_at', { ascending: false });

      if (choresError) console.error('Error fetching chores:', choresError);

      // 2. Fetch chore completions for this child
      const { data: completionsData, error: completionsError } = await supabase
        .from('chore_completions')
        .select('*')
        .eq('child_id', currentChild.id);

      if (completionsError) console.error('Error fetching completions:', completionsError);
      
      // 3. Filter out chores that are already completed for the current period
      const allChores = choresData || [];
      const completions = (completionsData || []) as ChoreCompletion[];
      const upcomingChores = allChores.filter(
        chore => !isChoreCompletedForPeriod(chore, completions)
      );
      
      setAssignedChores(upcomingChores);

      // 2. Fetch Story Books
      const { data: booksData, error: booksError } = await supabase
        .from('story_books')
        .select('*')
        .eq('child_id', currentChild.id)
        .order('updated_at', { ascending: false });

      if (booksError) {
        console.error('Error fetching books:', booksError);
      }
      
      // If we have books, use them. If not, we might need to fetch chapters to check for celebration or fallback
      setBooks(booksData || []);

      // 3. Check for recent unlocks (Celebration Logic) - keeping this from original
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('story_chapters')
        .select('*')
        .eq('child_id', currentChild.id)
        .order('chapter_number', { ascending: false })
        .limit(1);

      if (!chaptersError && chaptersData && chaptersData.length > 0) {
        const latestChapter = chaptersData[0];
        const unlockedAt = new Date(latestChapter.unlocked_at);
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        if (unlockedAt > fiveMinutesAgo && !latestChapter.is_read && !celebratedChaptersRef.current.has(latestChapter.id)) {
          celebratedChaptersRef.current.add(latestChapter.id);
          setCelebrationChapter(latestChapter);
          setShowCelebration(true);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [currentChild?.id])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
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

  const filteredBooks = books.filter(book => {
    if (selectedCategory === 'all') return true;
    const category = CATEGORIES.find(c => c.id === selectedCategory);
    return book.theme === category?.theme;
  });

  // Render a book card
  const renderBookCard = ({ item: book }: { item: StoryBook }) => {
    // Use the book's cover_image directly (selected once when book was created)
    const coverImage = book.cover_image;
    
    return (
      <TouchableOpacity
        style={[styles.bookCard, { backgroundColor: getThemeColor(book.theme) }]}
        onPress={() => {
          // Navigate to book details, passing the book ID to show its chapters
          navigation.navigate('StoriesList', { bookId: book.id }); 
        }}
      >
        <View style={styles.bookCardContent}>
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
            <Text style={styles.bookChapters}>{book.current_chapter} Chapters</Text>
          </View>
          {coverImage ? (
            <View style={styles.bookImageContainer}>
              <Image 
                source={{ uri: coverImage }} 
                style={styles.bookCoverImage}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={styles.bookImagePlaceholder}>
              <Text style={styles.bookEmoji}>{getThemeEmoji(book.theme)}</Text>
            </View>
          )}
        </View>
        {/* Stack effect visuals */}
        <View style={[styles.cardStack, { bottom: -5, width: '90%', zIndex: -1 }]} />
        <View style={[styles.cardStack, { bottom: -10, width: '80%', zIndex: -2 }]} />
      </TouchableOpacity>
    );
  };

  const getThemeColor = (themeName: string) => {
    switch (themeName) {
      case 'magical_forest': return '#e1f5fe'; // light blue
      case 'space_adventure': return '#e8eaf6'; // light indigo
      case 'underwater_kingdom': return '#e0f2f1'; // light teal
      default: return '#f5f5f5';
    }
  };

  const getThemeEmoji = (themeName: string) => {
    switch (themeName) {
      case 'magical_forest': return '🌲';
      case 'space_adventure': return '🚀';
      case 'underwater_kingdom': return '🐠';
      default: return '📚';
    }
  };

  // Render a chore circle
  const renderChoreCircle = (chore: Chore) => (
    <TouchableOpacity
      key={chore.id}
      style={styles.choreCircleContainer}
      onPress={() => navigation.navigate('ChoreDetail', { choreId: chore.id })}
    >
      <View style={styles.choreCircle}>
        <Text style={styles.choreEmoji}>{chore.icon || '🧹'}</Text>
      </View>
      <Text style={styles.choreCircleTitle} numberOfLines={1}>{chore.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>Hello, {currentChild?.name || 'Friend'}!</Text>
                <Text style={styles.subtitle}>Ready for today's adventures?</Text>
            </View>
        </View>
        
        {/* Stats Section */}
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

        {/* Stories Section (Recommendations) */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Stories</Text>
            {books.length > 0 ? (
                <FlatList
                    data={filteredBooks}
                    renderItem={renderBookCard}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.booksList}
                    snapToInterval={width * 0.6 + 20} // card width + margin
                    decelerationRate="fast"
                />
            ) : (
                <View style={styles.emptyStateCard}>
                    <Text style={styles.emptyStateText}>No stories yet. Start a new adventure!</Text>
                </View>
            )}
        </View>

        {/* Chores Quick Nav (Top Authors style) */}
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Chores</Text>
                <TouchableOpacity onPress={() => navigation.navigate('MyProgress')}> 
                    <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.choresScroll} contentContainerStyle={styles.choresContent}>
                {assignedChores.map(renderChoreCircle)}
                {assignedChores.length === 0 && (
                    <Text style={styles.noChoresText}>No chores today! 🎉</Text>
                )}
            </ScrollView>
        </View>

        {/* Categories (Themes) */}
        <View style={[styles.sectionContainer, styles.lastSection]}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContent}>
                {CATEGORIES.map(category => (
                    <TouchableOpacity
                        key={category.id}
                        style={[
                            styles.categoryPill,
                            selectedCategory === category.id && styles.categoryPillSelected
                        ]}
                        onPress={() => setSelectedCategory(category.id)}
                    >
                        <View style={[
                            styles.categoryIcon, 
                            selectedCategory === category.id ? styles.categoryIconSelected : styles.categoryIconUnselected
                        ]}>
                            {/* Simple colored circle as icon placeholder */}
                        </View>
                        <Text style={[
                            styles.categoryText,
                            selectedCategory === category.id && styles.categoryTextSelected
                        ]}>
                            {category.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

      </ScrollView>

      {/* Celebration Modal */}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    paddingTop: 60, // Add padding for header
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: theme.colors.primary,
  },
  avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
  },
  avatarText: {
      color: '#fff',
      fontSize: 20,
      fontWeight: 'bold',
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
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
    fontSize: 32,
    fontWeight: '900',
    color: '#FF8C42',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Sections
  sectionContainer: {
      marginBottom: theme.spacing.xl,
  },
  lastSection: {
      marginBottom: 40,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
  },
  sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
  },
  viewAllText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
  },

  // Books / Stories
  booksList: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: 20, // for shadows
  },
  bookCard: {
      width: width * 0.6,
      height: 200,
      backgroundColor: '#fff',
      borderRadius: 24,
      marginRight: theme.spacing.lg,
      padding: theme.spacing.lg,
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
      position: 'relative',
  },
  bookCardContent: {
      flex: 1,
  },
  bookInfo: {
      marginBottom: theme.spacing.md,
  },
  bookTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
  },
  bookChapters: {
      fontSize: 14,
      color: theme.colors.textSecondary,
  },
  bookImagePlaceholder: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.5)',
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
  },
  bookEmoji: {
      fontSize: 60,
  },
  bookImageContainer: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
  },
  bookCoverImage: {
      width: '100%',
      height: '100%',
      borderRadius: 16,
  },
  cardStack: {
      position: 'absolute',
      height: 20,
      backgroundColor: '#fff',
      borderRadius: 24,
      alignSelf: 'center',
      opacity: 0.5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
  },
  emptyStateCard: {
      marginHorizontal: theme.spacing.lg,
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      alignItems: 'center',
  },
  emptyStateText: {
      color: theme.colors.textSecondary,
  },

  // Chores
  choresScroll: {
      paddingLeft: theme.spacing.lg,
  },
  choresContent: {
      paddingRight: theme.spacing.lg,
  },
  choreCircleContainer: {
      alignItems: 'center',
      marginRight: theme.spacing.lg,
      width: 70,
  },
  choreCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.colors.border,
  },
  choreEmoji: {
      fontSize: 30,
  },
  choreCircleTitle: {
      fontSize: 12,
      color: theme.colors.text,
      textAlign: 'center',
      fontWeight: '500',
  },
  noChoresText: {
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
  },

  // Categories
  categoriesScroll: {
      paddingLeft: theme.spacing.lg,
  },
  categoriesContent: {
      paddingRight: theme.spacing.lg,
  },
  categoryPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginRight: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
  },
  categoryPillSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
  },
  categoryIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      marginRight: 8,
  },
  categoryIconSelected: {
      backgroundColor: 'rgba(255,255,255,0.3)',
  },
  categoryIconUnselected: {
      backgroundColor: theme.colors.border,
  },
  categoryText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
  },
  categoryTextSelected: {
      color: '#fff',
  },
});
