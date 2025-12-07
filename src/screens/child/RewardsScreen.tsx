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
import { Reward, RewardRedemption } from '../../types';
import { theme } from '../../utils/theme';
import { NotificationService } from '../../services/notificationService';

export default function RewardsScreen() {
  const { currentChild, refreshChildren } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);

  const fetchRewards = async () => {
    if (!currentChild?.parent_id) return;

    try {
      // Fetch available rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('parent_id', currentChild.parent_id)
        .eq('is_active', true)
        .order('points_cost', { ascending: true });

      if (rewardsError) {
        console.error('Error fetching rewards:', rewardsError);
        Alert.alert('Error', 'Failed to load rewards');
        return;
      }

      // Fetch existing redemptions
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          reward:rewards(*)
        `)
        .eq('child_id', currentChild.id)
        .order('created_at', { ascending: false });

      if (redemptionsError) {
        console.error('Error fetching redemptions:', redemptionsError);
        Alert.alert('Error', 'Failed to load redemptions');
        return;
      }

      const availableRewards = (rewardsData || []).filter((reward) => {
        if (reward.is_recurring) return true;

        if (reward.quantity !== null && reward.quantity !== undefined && reward.quantity <= 0) {
          return false;
        }

        const hasPendingOrApproved = redemptionsData?.some(
          redemption =>
            redemption.reward_id === reward.id &&
            (redemption.status === 'pending' || redemption.status === 'approved')
        );

        return !hasPendingOrApproved;
      });

      setRewards(availableRewards);
      setRedemptions(redemptionsData || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      Alert.alert('Error', 'Failed to load rewards');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRewards();
    }, [currentChild])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchRewards();
  };

  const redeemReward = async (reward: Reward) => {
    if (!currentChild) return;

    if (currentChild.total_points < reward.points_cost) {
      Alert.alert(
        'Not Enough Points',
        `You need ${reward.points_cost} points to redeem this reward, but you only have ${currentChild.total_points} points.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const confirmationMessage = reward.auto_approve
      ? `Redeem "${reward.title}" for ${reward.points_cost} points? This reward will be unlocked instantly!`
      : `Are you sure you want to redeem "${reward.title}" for ${reward.points_cost} points?`;

    Alert.alert(
      'Redeem Reward',
      confirmationMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: reward.auto_approve ? 'Unlock' : 'Redeem',
          onPress: async () => {
            setIsRedeeming(reward.id);
            try {
              if (reward.auto_approve) {
                const { error: redemptionError } = await supabase
                  .from('reward_redemptions')
                  .insert({
                    reward_id: reward.id,
                    child_id: currentChild.id,
                    status: 'approved',
                  });

                if (redemptionError) {
                  console.error('Error auto-approving reward:', redemptionError);
                  Alert.alert('Error', 'Failed to redeem reward');
                  return;
                }

                const newPointTotal = Math.max(currentChild.total_points - reward.points_cost, 0);
                const { error: childUpdateError } = await supabase
                  .from('children')
                  .update({ total_points: newPointTotal })
                  .eq('id', currentChild.id);

                if (childUpdateError) {
                  console.error('Error updating child points:', childUpdateError);
                  Alert.alert('Error', 'Reward was redeemed but points could not be updated.');
                  return;
                }

                if (!reward.is_recurring) {
                  const updates: Record<string, any> = {};
                  if (reward.quantity !== null && reward.quantity !== undefined) {
                    const remaining = Math.max(reward.quantity - 1, 0);
                    updates.quantity = remaining;
                    if (remaining === 0) {
                      updates.is_active = false;
                    }
                  } else {
                    updates.is_active = false;
                  }

                  if (Object.keys(updates).length > 0) {
                    await supabase
                      .from('rewards')
                      .update(updates)
                      .eq('id', reward.id);
                  }
                }

                if (currentChild.parent_id) {
                  await NotificationService.notifyRewardRedemption(
                    currentChild.id,
                    reward.id,
                    currentChild.parent_id,
                    'approved'
                  );
                }

                await refreshChildren();
                Alert.alert(
                  'Reward Unlocked! 🎉',
                  'Enjoy your reward right away!',
                  [{ text: 'OK' }]
                );
              } else {
                const { error } = await supabase
                  .from('reward_redemptions')
                  .insert({
                    reward_id: reward.id,
                    child_id: currentChild.id,
                    status: 'pending',
                  });

                if (error) {
                  console.error('Error redeeming reward:', error);
                  Alert.alert('Error', 'Failed to redeem reward');
                  return;
                }

                if (!reward.is_recurring) {
                  const updates: Record<string, any> = {};
                  if (reward.quantity !== null && reward.quantity !== undefined) {
                    const remaining = Math.max(reward.quantity - 1, 0);
                    updates.quantity = remaining;
                    if (remaining === 0) {
                      updates.is_active = false;
                    }
                  } else {
                    updates.is_active = false;
                  }

                  if (Object.keys(updates).length > 0) {
                    await supabase
                      .from('rewards')
                      .update(updates)
                      .eq('id', reward.id);
                  }
                }

                if (currentChild.parent_id) {
                  await NotificationService.notifyRewardRedemption(
                    currentChild.id,
                    reward.id,
                    currentChild.parent_id,
                    'pending'
                  );
                }

                if (currentChild.parent_id) {
                  await NotificationService.notifyRewardRedemption(
                    currentChild.id,
                    reward.id,
                    currentChild.parent_id,
                    'pending'
                  );
                }

                Alert.alert(
                  'Reward Requested! 🎉',
                  'Your reward request has been sent to your parent for approval.',
                  [{ text: 'OK' }]
                );
              }

              fetchRewards();
            } catch (error) {
              console.error('Error redeeming reward:', error);
              Alert.alert('Error', 'Failed to redeem reward');
            } finally {
              setIsRedeeming(null);
            }
          },
        },
      ]
    );
  };

  const getRewardTypeEmoji = (type: string) => {
    switch (type) {
      case 'badge': return '🏆';
      case 'special_chapter': return '📚';
      case 'streak_boost': return '⚡';
      case 'real_reward': return '🎁';
      default: return '🎯';
    }
  };

  const getRewardTypeColor = (type: string) => {
    switch (type) {
      case 'badge': return '#FF9800';
      case 'special_chapter': return '#2196F3';
      case 'streak_boost': return '#9C27B0';
      case 'real_reward': return '#4CAF50';
      default: return theme.colors.primary;
    }
  };

  const getRedemptionStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'approved': return theme.colors.success;
      case 'denied': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const renderRewardCard = (reward: Reward) => {
    const canAfford = currentChild ? currentChild.total_points >= reward.points_cost : false;
    const isRewardRedeeming = isRedeeming === reward.id;

    return (
      <View key={reward.id} style={styles.rewardCard}>
        {reward.thumbnail_url ? (
          <Image
            source={{ uri: reward.thumbnail_url }}
            style={[
              styles.rewardImage,
              !canAfford && styles.rewardImageDisabled,
            ]}
            resizeMode="cover"
          />
        ) : null}

        <View style={styles.rewardHeader}>
          <View style={styles.rewardTitleContainer}>
            <Text style={styles.rewardEmoji}>
              {getRewardTypeEmoji(reward.type)}
            </Text>
            <View style={styles.rewardTitleText}>
              <Text style={styles.rewardTitle}>{reward.title}</Text>
              <View style={styles.rewardMetaRow}>
                <Text style={styles.rewardType}>
                  {reward.type.replace('_', ' ').toUpperCase()}
                </Text>
                {reward.category ? (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {reward.category.replace('_', ' ')}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
          <View style={[
            styles.rewardCost,
            { backgroundColor: canAfford ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            <Text style={styles.costText}>{reward.points_cost} pts</Text>
          </View>
        </View>

        <Text style={styles.rewardDescription}>{reward.description}</Text>

        {reward.fulfillment_instructions ? (
          <View style={styles.fulfillmentSection}>
            <Text style={styles.fulfillmentLabel}>What you'll get</Text>
            <Text style={styles.fulfillmentText}>
              {reward.fulfillment_instructions}
            </Text>
          </View>
        ) : null}

        {reward.quantity !== null && reward.quantity !== undefined && !reward.is_recurring ? (
          <Text style={styles.rewardQuantityText}>
            Remaining redemptions: {Math.max(reward.quantity, 0)}
          </Text>
        ) : null}

        {reward.estimated_fulfillment_time ? (
          <View style={styles.fulfillmentSection}>
            <Text style={styles.fulfillmentLabel}>When you'll get it</Text>
            <Text style={styles.fulfillmentText}>
              {reward.estimated_fulfillment_time}
            </Text>
          </View>
        ) : null}

        {reward.auto_approve ? (
          <View style={styles.autoApproveBanner}>
            <Text style={styles.autoApproveText}>Instant reward — no parent approval needed!</Text>
          </View>
        ) : null}

        <View style={styles.rewardFooter}>
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsText}>
              You have {currentChild?.total_points || 0} points
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.redeemButton,
              !canAfford && styles.redeemButtonDisabled,
              isRewardRedeeming && styles.redeemButtonLoading
            ]}
            onPress={() => redeemReward(reward)}
            disabled={!canAfford || isRewardRedeeming}
          >
            {isRewardRedeeming ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[
                styles.redeemButtonText,
                !canAfford && styles.redeemButtonTextDisabled
              ]}>
                {canAfford
                  ? reward.auto_approve
                    ? 'Unlock Now'
                    : 'Redeem'
                  : 'Need More Points'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRedemptionCard = (redemption: any) => (
    <View key={redemption.id} style={styles.redemptionCard}>
      <View style={styles.redemptionHeader}>
        <Text style={styles.redemptionEmoji}>
          {getRewardTypeEmoji(redemption.reward.type)}
        </Text>
        <View style={styles.redemptionTitleText}>
          <Text style={styles.redemptionTitle}>{redemption.reward.title}</Text>
          <Text style={styles.redemptionDate}>
            Requested {new Date(redemption.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getRedemptionStatusColor(redemption.status) }
        ]}>
          <Text style={styles.statusText}>
            {redemption.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {redemption.parent_notes && (
        <Text style={styles.parentNotes}>
          Parent note: {redemption.parent_notes}
        </Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading rewards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Rewards</Text>
        <Text style={styles.subtitle}>
          Earn points to unlock amazing rewards!
        </Text>
        <View style={styles.pointsDisplay}>
          <Text style={styles.pointsLabel}>Your Points</Text>
          <Text style={styles.pointsValue}>{currentChild?.total_points || 0}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {rewards.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>🎯 No rewards available</Text>
            <Text style={styles.emptyText}>
              Ask your parent to create some rewards for you!
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Rewards</Text>
              <View style={styles.rewardsList}>
                {rewards.map(renderRewardCard)}
              </View>
            </View>

            {redemptions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Requests</Text>
                <View style={styles.redemptionsList}>
                  {redemptions.map(renderRedemptionCard)}
                </View>
              </View>
            )}
          </>
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
  // Treasure gallery header with warm sunset glow
  header: {
    padding: theme.spacing.xl,
    backgroundColor: 'rgba(255, 179, 71, 0.15)',
    borderBottomWidth: 0,
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
    marginBottom: theme.spacing.xl,
    fontWeight: '500',
    lineHeight: 26,
  },
  // Sunset gold points display
  pointsDisplay: {
    backgroundColor: '#FFB347',
    padding: theme.spacing.xl,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#FFB347',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 71, 0.3)',
  },
  pointsLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: theme.spacing.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  pointsValue: {
    fontSize: 56,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
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
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: theme.spacing.xl * 1.5,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    letterSpacing: -0.5,
  },
  rewardsList: {
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.xl,
  },
  redemptionsList: {
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  // Treasure prize cards with warm magical glow
  rewardCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.1)',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
    gap: theme.spacing.lg,
    overflow: 'hidden',
  },
  rewardImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: theme.spacing.md,
  },
  rewardImageDisabled: {
    opacity: 0.5,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rewardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  rewardEmoji: {
    fontSize: 40,
    marginRight: theme.spacing.lg,
  },
  rewardTitleText: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  rewardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  rewardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rewardType: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: '#FFB347',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: 12,
    shadowColor: '#FFB347',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  rewardCost: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 999,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  costText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rewardDescription: {
    fontSize: 17,
    color: theme.colors.text,
    lineHeight: 26,
    opacity: 0.85,
  },
  fulfillmentSection: {
    backgroundColor: 'rgba(255, 179, 71, 0.08)',
    borderRadius: 16,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.15)',
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
  rewardQuantityText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  autoApproveBanner: {
    backgroundColor: theme.colors.success,
    padding: theme.spacing.md,
    borderRadius: 16,
    shadowColor: theme.colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  autoApproveText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsInfo: {
    flex: 1,
  },
  pointsText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  // Phoenix orange redeem button
  redeemButton: {
    backgroundColor: '#FF8C42',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  redeemButtonDisabled: {
    backgroundColor: theme.colors.textSecondary,
    shadowOpacity: 0.2,
  },
  redeemButtonLoading: {
    opacity: 0.7,
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  redeemButtonTextDisabled: {
    color: '#fff',
  },
  redemptionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.15)',
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  redemptionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  redemptionEmoji: {
    fontSize: 20,
    marginRight: theme.spacing.md,
  },
  redemptionTitleText: {
    flex: 1,
  },
  redemptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  redemptionDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 2,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  parentNotes: {
    fontSize: 14,
    color: theme.colors.text,
    fontStyle: 'italic',
    backgroundColor: 'rgba(255, 179, 71, 0.08)',
    padding: theme.spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.15)',
  },
});
