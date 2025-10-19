import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme, getStoryWorldColors } from '../../utils/theme';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Child, ParentStackParamList } from '../../types';

type ChildProfilesScreenNavigationProp = StackNavigationProp<ParentStackParamList, 'ChildProfiles'>;

export default function ChildProfilesScreen() {
  const navigation = useNavigation<ChildProfilesScreenNavigationProp>();
  const { children, refreshChildren } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadChildren = async () => {
      setLoading(true);
      await refreshChildren();
      setLoading(false);
    };
    loadChildren();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshChildren();
    setRefreshing(false);
  };

  const handleDeleteChild = (child: Child) => {
    Alert.alert(
      'Delete Child Profile',
      `Are you sure you want to delete ${child.name}'s profile? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('children')
                .delete()
                .eq('id', child.id);

              if (error) {
                console.error('Error deleting child:', error);
                Alert.alert('Error', 'Failed to delete child profile');
                return;
              }

              await refreshChildren();
              Alert.alert('Success', 'Child profile deleted successfully');
            } catch (error) {
              console.error('Error deleting child:', error);
              Alert.alert('Error', 'Failed to delete child profile');
            }
          },
        },
      ]
    );
  };

  const renderChildItem = ({ item }: { item: Child }) => {
    const worldColors = getStoryWorldColors(item.world_theme);
    
    return (
      <TouchableOpacity
        style={[styles.childCard, { borderLeftColor: worldColors.primary }]}
        onPress={() => navigation.navigate('ChildDetail', { childId: item.id })}
      >
        <View style={styles.childHeader}>
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{item.name}</Text>
            <Text style={styles.childAge}>Age {item.age} • {item.age_bracket}</Text>
            <Text style={[styles.worldTheme, { color: worldColors.primary }]}>
              {item.world_theme.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
          <View style={styles.childStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.current_streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.total_points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.childActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ChildDetail', { childId: item.id })}
          >
            <Ionicons name="eye-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => navigation.navigate('ChildDetail', { childId: item.id })}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.warning} />
            <Text style={[styles.actionText, { color: theme.colors.warning }]}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteChild(item)}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            <Text style={[styles.actionText, { color: theme.colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Children Yet</Text>
      <Text style={styles.emptySubtitle}>
        Add your first child to start managing chores and generating stories!
      </Text>
      <TouchableOpacity
        style={styles.addChildButton}
        onPress={() => navigation.navigate('CreateChild' as any)}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addChildButtonText}>Add Your First Child</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading children...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Child Profiles</Text>
        <Text style={styles.subtitle}>Manage your children's profiles and settings</Text>
      </View>

      {children.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{children.length}</Text>
              <Text style={styles.statLabel}>Total Children</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {children.reduce((sum, child) => sum + child.current_streak, 0)}
              </Text>
              <Text style={styles.statLabel}>Combined Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {children.reduce((sum, child) => sum + child.total_points, 0)}
              </Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
          </View>

          <FlatList
            data={children}
            renderItem={renderChildItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {children.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateChild' as any)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      )}
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
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100, // Space for FAB
  },
  childCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  childAge: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  worldTheme: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  childStats: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  childActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  editButton: {
    backgroundColor: '#FEF3C7',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  actionText: {
    marginLeft: theme.spacing.xs,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  addChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 12,
  },
  addChildButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
