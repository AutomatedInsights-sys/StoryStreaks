import React, { useState, useCallback } from 'react';
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
import { NotificationService } from '../../services/notificationService';
import { RewardRedemption } from '../../types';
import { theme } from '../../utils/theme';

interface RewardRequest extends RewardRedemption {
  reward: {
    id: string;
    title: string;
    description: string;
    points_cost: number;
    type: string;
    auto_approve?: boolean | null;
    is_recurring?: boolean | null;
    quantity?: number | null;
    fulfillment_instructions?: string | null;
    estimated_fulfillment_time?: string | null;
  };
  child: {
    id: string;
    name: string;
    total_points: number;
    parent_id: string;
  };
}

export default function RewardRequestsScreen() {
  const { user, children, refreshChildren } = useAuth();
  const [requests, setRequests] = useState<RewardRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = async () => {
    if (!user?.id || !children || children.length === 0) {
      setRequests([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      const childIds = children.map(child => child.id);
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          reward:rewards(*),
          child:children(*)
        `)
        .eq('status', 'pending')
        .in('child_id', childIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reward requests:', error);
        Alert.alert('Error', 'Failed to load reward requests');
        return;
      }

      setRequests((data as RewardRequest[]) || []);
    } catch (error) {
      console.error('Error fetching reward requests:', error);
      Alert.alert('Error', 'Failed to load reward requests');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [user?.id, children?.length])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchRequests();
  };

  const updateRewardInventory = async (request: RewardRequest) => {
    if (request.reward.is_recurring) {
      return;
    }

    const updates: Record<string, any> = {};
    if (request.reward.quantity !== null && request.reward.quantity !== undefined) {
      const remaining = Math.max((request.reward.quantity ?? 0) - 1, 0);
      updates.quantity = remaining;
      if (remaining === 0) {
        updates.is_active = false;
      }
    } else {
      updates.is_active = false;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('rewards')
        .update(updates)
        .eq('id', request.reward_id);

      if (error) {
        console.error('Error updating reward availability:', error);
        Alert.alert('Error', 'Failed to update reward availability');
      }
    }
  };

  const handleApprove = async (request: RewardRequest) => {
    setIsProcessing(true);
    try {
      const { data: childRecord, error: childError } = await supabase
        .from('children')
        .select('total_points')
        .eq('id', request.child_id)
        .single();

      if (childError) {
        console.error('Error fetching child record:', childError);
        Alert.alert('Error', 'Failed to approve reward');
        return;
      }

      const currentPoints = childRecord?.total_points ?? 0;
      if (currentPoints < request.reward.points_cost) {
        Alert.alert(
          'Not Enough Points',
          `${request.child.name} no longer has enough points to redeem this reward.`
        );
        return;
      }

      const newPointTotal = Math.max(currentPoints - request.reward.points_cost, 0);

      const { error: pointsError } = await supabase
        .from('children')
        .update({ total_points: newPointTotal })
        .eq('id', request.child_id);

      if (pointsError) {
        console.error('Error updating child points:', pointsError);
        Alert.alert('Error', 'Failed to approve reward');
        return;
      }

      const { error: statusError } = await supabase
        .from('reward_redemptions')
        .update({ status: 'approved' })
        .eq('id', request.id);

      if (statusError) {
        console.error('Error updating reward redemption status:', statusError);
        Alert.alert('Error', 'Failed to approve reward');
        return;
      }

      await updateRewardInventory(request);

      await refreshChildren();

      await NotificationService.notifyRewardDecision(
        request.child_id,
        request.reward_id,
        true
      );

      Alert.alert('Reward Approved', `${request.child.name} has been rewarded!`);
      fetchRequests();
    } catch (error) {
      console.error('Error approving reward:', error);
      Alert.alert('Error', 'Failed to approve reward');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async (request: RewardRequest) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('reward_redemptions')
        .update({ status: 'denied' })
        .eq('id', request.id);

      if (error) {
        console.error('Error denying reward request:', error);
        Alert.alert('Error', 'Failed to update reward request');
        return;
      }

      await NotificationService.notifyRewardDecision(
        request.child_id,
        request.reward_id,
        false
      );

      Alert.alert('Request Denied', `${request.child.name} has been notified.`);
      fetchRequests();
    } catch (error) {
      console.error('Error denying reward request:', error);
      Alert.alert('Error', 'Failed to update reward request');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmAction = (request: RewardRequest, approved: boolean) => {
    const title = approved ? 'Approve Reward?' : 'Deny Reward?';
    const message = approved
      ? `Approve "${request.reward.title}" for ${request.child.name}?`
      : `Deny "${request.reward.title}" for ${request.child.name}?`;

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: approved ? 'Approve' : 'Deny',
        style: approved ? 'default' : 'destructive',
        onPress: () => (approved ? handleApprove(request) : handleDeny(request)),
      },
    ]);
  };

  const renderRequestCard = (request: RewardRequest) => (
    <View key={request.id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestTitleContainer}>
          <Text style={styles.rewardTitle}>{request.reward.title}</Text>
          <Text style={styles.childName}>Requested by {request.child.name}</Text>
        </View>
        <View style={styles.pointsChip}>
          <Text style={styles.pointsText}>{request.reward.points_cost} pts</Text>
        </View>
      </View>

      <Text style={styles.rewardDescription}>{request.reward.description}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>
          Submitted {new Date(request.created_at).toLocaleDateString()}
        </Text>
        {request.reward.is_recurring ? (
          <View style={[styles.badge, styles.recurringBadge]}>
            <Text style={styles.badgeText}>Recurring</Text>
          </View>
        ) : null}
        {request.reward.quantity !== null && request.reward.quantity !== undefined ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              Remaining {Math.max(request.reward.quantity, 0)}
            </Text>
          </View>
        ) : null}
      </View>

      {request.reward.fulfillment_instructions ? (
        <View style={styles.fulfillmentSection}>
          <Text style={styles.fulfillmentLabel}>Notes for you</Text>
          <Text style={styles.fulfillmentText}>
            {request.reward.fulfillment_instructions}
          </Text>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.denyButton]}
          onPress={() => confirmAction(request, false)}
          disabled={isProcessing}
        >
          <Text style={styles.actionButtonText}>Deny</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => confirmAction(request, true)}
          disabled={isProcessing}
        >
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading reward requests...</Text>
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
          <Text style={styles.title}>Reward Requests</Text>
          <Text style={styles.subtitle}>
            Approve or deny reward redemptions from your children
          </Text>
        </View>

        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>🎁 No pending requests</Text>
            <Text style={styles.emptyText}>
              When your children redeem rewards, their requests will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.requestsList}>
            {requests.map(renderRequestCard)}
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
  scrollView: {
    flex: 1,
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
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  requestsList: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  requestCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  requestTitleContainer: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  childName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  pointsChip: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
  },
  pointsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rewardDescription: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: 12,
  },
  recurringBadge: {
    backgroundColor: theme.colors.secondary,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  fulfillmentSection: {
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  fulfillmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  fulfillmentText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: theme.colors.success,
  },
  denyButton: {
    backgroundColor: theme.colors.error,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

