import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { theme } from '../../utils/theme';
import { Chore, Child } from '../../types';

interface ChoreWithChildren extends Chore {
  assigned_children: Child[];
  completion_count: number;
  total_assignments: number;
}

export default function ChoreManagementScreen() {
  const navigation = useNavigation();
  const { user, children } = useAuth();
  const [chores, setChores] = useState<ChoreWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'one-time'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'title' | 'points'>('created');

  const loadChores = async () => {
    if (!user || user.role !== 'parent') {
      return;
    }

    try {
      const { data: choresData, error } = await supabase
        .from('chores')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Get completion counts and assigned children for each chore
      const choresWithCompletions = await Promise.all(
        (choresData || []).map(async (chore) => {
          // Get completion counts
          const { data: completions, error: completionError } = await supabase
            .from('chore_completions')
            .select('id')
            .eq('chore_id', chore.id)
            .eq('status', 'approved');

          // Get assigned children details
          let assignedChildren = [];
          if (chore.assigned_to && chore.assigned_to.length > 0) {
            const { data: childrenData, error: childrenError } = await supabase
              .from('children')
              .select('*')
              .in('id', chore.assigned_to);
            
            if (!childrenError && childrenData) {
              assignedChildren = childrenData;
            }
          }

          return {
            ...chore,
            assigned_children: assignedChildren,
            completion_count: completions?.length || 0,
            total_assignments: chore.assigned_to?.length || 0,
          };
        })
      );

      setChores(choresWithCompletions);
    } catch (error) {
      console.error('Error loading chores:', error);
      Alert.alert('Error', 'Failed to load chores. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadChores();
    }, [user])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadChores();
  };

  const handleDeleteChore = (choreId: string, choreTitle: string) => {
    Alert.alert(
      'Delete Chore',
      `Are you sure you want to delete "${choreTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('chores')
                .delete()
                .eq('id', choreId);

              if (error) {
                throw error;
              }

              setChores(prev => prev.filter(chore => chore.id !== choreId));
            } catch (error) {
              console.error('Error deleting chore:', error);
              Alert.alert('Error', 'Failed to delete chore. Please try again.');
            }
          },
        },
      ]
    );
  };

  const filteredAndSortedChores = chores
    .filter(chore => filter === 'all' || chore.recurrence === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'points':
          return b.points - a.points;
        case 'created':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const getRecurrenceColor = (recurrence: string) => {
    switch (recurrence) {
      case 'daily':
        return theme.colors.success;
      case 'weekly':
        return theme.colors.warning;
      case 'one-time':
        return theme.colors.primary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getRecurrenceIcon = (recurrence: string) => {
    switch (recurrence) {
      case 'daily':
        return '🔄';
      case 'weekly':
        return '📅';
      case 'one-time':
        return '⭐';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading chores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Chore Management</Text>
        <Text style={styles.subtitle}>
          {chores.length} {chores.length === 1 ? 'chore' : 'chores'} created
        </Text>
      </View>

      {/* Filter and Sort Controls */}
      <View style={styles.controls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {[
            { value: 'all', label: 'All' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'one-time', label: 'One-time' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterButton,
                filter === option.value && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(option.value as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === option.value && styles.filterButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { value: 'created', label: 'Newest' },
              { value: 'title', label: 'Title' },
              { value: 'points', label: 'Points' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortButton,
                  sortBy === option.value && styles.sortButtonActive,
                ]}
                onPress={() => setSortBy(option.value as any)}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === option.value && styles.sortButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Chores List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredAndSortedChores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No chores found</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all'
                ? 'Create your first chore to get started'
                : `No ${filter} chores found`}
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateChore' as never)}
            >
              <Text style={styles.createButtonText}>Create Chore</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.choresList}>
            {filteredAndSortedChores.map((chore) => (
              <View key={chore.id} style={styles.choreCard}>
                <View style={styles.choreHeader}>
                  <View style={styles.choreTitleContainer}>
                    <Text style={styles.choreTitle}>{chore.title}</Text>
                    <View style={styles.choreMeta}>
                      <Text style={styles.chorePoints}>{chore.points} pts</Text>
                      <View
                        style={[
                          styles.recurrenceBadge,
                          { backgroundColor: getRecurrenceColor(chore.recurrence) + '20' },
                        ]}
                      >
                        <Text style={styles.recurrenceIcon}>
                          {getRecurrenceIcon(chore.recurrence)}
                        </Text>
                        <Text
                          style={[
                            styles.recurrenceText,
                            { color: getRecurrenceColor(chore.recurrence) },
                          ]}
                        >
                          {chore.recurrence.replace('-', ' ')}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.choreActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => navigation.navigate('EditChore' as never, { choreId: chore.id } as never)}
                    >
                      <Text style={styles.actionButtonText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteChore(chore.id, chore.title)}
                    >
                      <Text style={styles.actionButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.choreDescription}>{chore.description}</Text>

                <View style={styles.choreDetails}>
                  <View style={styles.assignedChildren}>
                    <Text style={styles.assignedLabel}>Assigned to:</Text>
                    <View style={styles.childrenList}>
                      {chore.assigned_children.map((child) => (
                        <View key={child.id} style={styles.childChip}>
                          <Text style={styles.childChipText}>{child.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.completionStats}>
                    <Text style={styles.completionText}>
                      {chore.completion_count}/{chore.total_assignments} completed
                    </Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${(chore.completion_count / Math.max(chore.total_assignments, 1)) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>

                {chore.deadline && (
                  <View style={styles.deadlineContainer}>
                    <Text style={styles.deadlineText}>
                      Due: {new Date(chore.deadline).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateChore' as never)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  controls: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  filterContainer: {
    marginBottom: theme.spacing.md,
  },
  filterButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  filterButtonTextActive: {
    color: theme.colors.surface,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  sortButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  sortButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  sortButtonTextActive: {
    color: theme.colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.surface,
  },
  choresList: {
    padding: theme.spacing.lg,
  },
  choreCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  choreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  choreTitleContainer: {
    flex: 1,
  },
  choreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  choreMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  chorePoints: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
  },
  recurrenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
  },
  recurrenceIcon: {
    fontSize: 12,
    marginRight: theme.spacing.xs,
  },
  recurrenceText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  choreActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
  },
  choreDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  choreDetails: {
    gap: theme.spacing.md,
  },
  assignedChildren: {
    gap: theme.spacing.sm,
  },
  assignedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  childrenList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  childChip: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  childChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  completionStats: {
    gap: theme.spacing.sm,
  },
  completionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
  },
  deadlineContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  deadlineText: {
    fontSize: 14,
    color: theme.colors.warning,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
});
