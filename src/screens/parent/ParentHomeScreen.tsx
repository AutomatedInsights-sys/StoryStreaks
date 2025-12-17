import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Child } from '../../types';
import { supabase } from '../../services/supabase';
import { theme } from '../../utils/theme';

export default function ParentHomeScreen({ navigation }: any) {
  const { user, children, refreshChildren } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [activeRewardsCount, setActiveRewardsCount] = useState(0);
  const [pendingRewardRequests, setPendingRewardRequests] = useState(0);

  const fetchPendingApprovalsCount = async () => {
    if (!user?.id) return;

    const childIds = (children || []).map(child => child.id);
    if (childIds.length === 0) {
      setPendingApprovalsCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('chore_completions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .in('child_id', childIds);

      if (error) {
        console.error('Error fetching pending approvals count:', error);
        return;
      }

      setPendingApprovalsCount(count || 0);
    } catch (error) {
      console.error('Error fetching pending approvals count:', error);
    }
  };

  const fetchRewardStats = async () => {
    if (!user?.id) return;

    try {
      const activeRewardsPromise = supabase
        .from('rewards')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', user.id)
        .eq('is_active', true);

      const childIds = (children || []).map(child => child.id);

      const pendingRedemptionsPromise =
        childIds.length === 0
          ? Promise.resolve({ count: 0, error: null })
          : supabase
              .from('reward_redemptions')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'pending')
              .in('child_id', childIds);

      const [{ count: rewardsCount, error: rewardsError }, { count: redemptionCount, error: redemptionError }] =
        await Promise.all([activeRewardsPromise, pendingRedemptionsPromise]);

      if (rewardsError) {
        console.error('Error fetching active rewards count:', rewardsError);
      } else {
        setActiveRewardsCount(rewardsCount || 0);
      }

      if (redemptionError) {
        console.error('Error fetching pending reward requests:', redemptionError);
      } else {
        setPendingRewardRequests(redemptionCount || 0);
      }
    } catch (error) {
      console.error('Error fetching reward stats:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchPendingApprovalsCount();
      fetchRewardStats();
    }, [user?.id, children.length])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshChildren();
    await fetchPendingApprovalsCount();
    await fetchRewardStats();
    setIsRefreshing(false);
  };

  const renderChildCard = (child: Child) => {
    return (
      <TouchableOpacity
        key={child.id}
        style={styles.childCard}
        onPress={() => navigation.navigate('ChildDetail', { childId: child.id })}
      >
        <Text style={styles.childName}>{child.name}</Text>
        <Text style={styles.childAge}>Age {child.age}</Text>
        <Text style={styles.childWorld}>{child.world_theme.replace('_', ' ')}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{child.current_streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{child.total_points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>
        <View style={styles.childActionsRow}>
          <TouchableOpacity
            style={styles.childActionButton}
            onPress={() => navigation.navigate('ChildDetail', { childId: child.id })}
          >
            <Ionicons name="person-circle-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.childActionLabel}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.childActionButton}
            onPress={() => navigation.navigate('RewardsManagement')}
          >
            <Ionicons name="gift-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.childActionLabel}>Rewards</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Hello, {user?.name}!</Text>
          <Text style={styles.subtitle}>Track your children's progress</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('CreateChore')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Create Chore</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('ChoreApproval')}
        >
          <View style={styles.actionButtonContent}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Review</Text>
            {pendingApprovalsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingApprovalsCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('RewardsManagement')}
        >
          <View style={styles.actionButtonContent}>
            <Ionicons name="gift-outline" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Rewards</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('RewardRequests')}
        >
          <View style={styles.actionButtonContent}>
            <Ionicons name="hand-left-outline" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Requests</Text>
            {pendingRewardRequests > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRewardRequests}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryHeader}>
        <Text style={styles.sectionTitle}>Today at a Glance</Text>
      </View>
      <View style={styles.summaryCards}>
        <TouchableOpacity
          style={styles.summaryCard}
          onPress={() => navigation.navigate('ChoreApproval')}
        >
          <Ionicons name="checkmark-done-circle" size={24} color={theme.colors.success} />
          <Text style={styles.summaryValue}>{pendingApprovalsCount}</Text>
          <Text style={styles.summaryLabel}>Chores to Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.summaryCard}
          onPress={() => navigation.navigate('RewardsManagement')}
        >
          <Ionicons name="gift" size={24} color={theme.colors.secondary} />
          <Text style={styles.summaryValue}>{activeRewardsCount}</Text>
          <Text style={styles.summaryLabel}>Active Rewards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.summaryCard}
          onPress={() => navigation.navigate('RewardRequests')}
        >
          <Ionicons name="sparkles-outline" size={24} color={theme.colors.warning} />
          <Text style={styles.summaryValue}>{pendingRewardRequests}</Text>
          <Text style={styles.summaryLabel}>Reward Requests</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.childrenSection}>
        <Text style={styles.sectionTitle}>Your Children</Text>
        {children.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No children added yet</Text>
            <TouchableOpacity
              style={styles.addChildButton}
              onPress={() => navigation.navigate('CreateChild')}
            >
              <Text style={styles.addChildButtonText}>Add Your First Child</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Tip: Add rewards to motivate your kids after chores!
            </Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('RewardsManagement')}
            >
              <Text style={styles.secondaryButtonText}>Manage Rewards</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.childrenGrid}>
            {children.map(renderChildCard)}
          </View>
        )}
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
    paddingTop: 60,
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
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexBasis: '48%',
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  summaryCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  summaryHeader: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  summaryCard: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  childrenSection: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  childrenGrid: {
    gap: theme.spacing.md,
  },
  childCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  childAge: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  childWorld: {
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  childActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  childActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: theme.spacing.xs,
  },
  childActionLabel: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  addChildButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
  },
  addChildButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  secondaryButton: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
