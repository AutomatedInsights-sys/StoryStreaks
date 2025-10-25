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
import { Reward, RewardRedemption } from '../../types';
import { theme } from '../../utils/theme';

export default function RewardsScreen() {
  const { currentChild } = useAuth();
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

      setRewards(rewardsData || []);
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

    Alert.alert(
      'Redeem Reward',
      `Are you sure you want to redeem "${reward.title}" for ${reward.points_cost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            setIsRedeeming(reward.id);
            try {
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

              Alert.alert(
                'Reward Requested! 🎉',
                'Your reward request has been sent to your parent for approval.',
                [{ text: 'OK' }]
              );

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
    const isRedeeming = isRedeeming === reward.id;

    return (
      <View key={reward.id} style={styles.rewardCard}>
        <View style={styles.rewardHeader}>
          <View style={styles.rewardTitleContainer}>
            <Text style={styles.rewardEmoji}>
              {getRewardTypeEmoji(reward.type)}
            </Text>
            <View style={styles.rewardTitleText}>
              <Text style={styles.rewardTitle}>{reward.title}</Text>
              <Text style={styles.rewardType}>
                {reward.type.replace('_', ' ').toUpperCase()}
              </Text>
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
              isRedeeming && styles.redeemButtonLoading
            ]}
            onPress={() => redeemReward(reward)}
            disabled={!canAfford || isRedeeming}
          >
            {isRedeeming ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[
                styles.redeemButtonText,
                !canAfford && styles.redeemButtonTextDisabled
              ]}>
                {canAfford ? 'Redeem' : 'Need More Points'}
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
    marginBottom: theme.spacing.lg,
  },
  pointsDisplay: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: theme.spacing.xs,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
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
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  rewardsList: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  redemptionsList: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  rewardCard: {
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
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  rewardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  rewardEmoji: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  rewardTitleText: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  rewardType: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  rewardCost: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
  },
  costText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rewardDescription: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
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
  redeemButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  redeemButtonDisabled: {
    backgroundColor: theme.colors.textSecondary,
  },
  redeemButtonLoading: {
    opacity: 0.7,
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  redeemButtonTextDisabled: {
    color: '#fff',
  },
  redemptionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    borderRadius: 12,
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
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: 8,
  },
});
