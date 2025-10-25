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
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { Reward, CreateRewardForm } from '../../types';
import { theme } from '../../utils/theme';

export default function RewardsManagementScreen() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateRewardForm>({
    title: '',
    description: '',
    points_cost: 0,
    type: 'badge',
  });

  const fetchRewards = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rewards:', error);
        Alert.alert('Error', 'Failed to load rewards');
        return;
      }

      setRewards(data || []);
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
    }, [user?.id])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchRewards();
  };

  const handleCreateReward = async () => {
    if (!user?.id) return;

    if (!formData.title.trim() || !formData.description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.points_cost <= 0) {
      Alert.alert('Error', 'Points cost must be greater than 0');
      return;
    }

    setIsCreating(true);

    try {
      const { data, error } = await supabase
        .from('rewards')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          points_cost: formData.points_cost,
          type: formData.type,
          parent_id: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating reward:', error);
        Alert.alert('Error', 'Failed to create reward');
        return;
      }

      Alert.alert('Success', 'Reward created successfully!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        points_cost: 0,
        type: 'badge',
      });
      fetchRewards();
    } catch (error) {
      console.error('Error creating reward:', error);
      Alert.alert('Error', 'Failed to create reward');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleRewardStatus = async (rewardId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('rewards')
        .update({ is_active: !currentStatus })
        .eq('id', rewardId);

      if (error) {
        console.error('Error updating reward status:', error);
        Alert.alert('Error', 'Failed to update reward status');
        return;
      }

      setRewards(prev =>
        prev.map(reward =>
          reward.id === rewardId
            ? { ...reward, is_active: !currentStatus }
            : reward
        )
      );
    } catch (error) {
      console.error('Error updating reward status:', error);
      Alert.alert('Error', 'Failed to update reward status');
    }
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

  const renderRewardCard = (reward: Reward) => (
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
        <View style={styles.rewardCost}>
          <Text style={styles.costText}>{reward.points_cost} pts</Text>
        </View>
      </View>

      <Text style={styles.rewardDescription}>{reward.description}</Text>

      <View style={styles.rewardFooter}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: reward.is_active ? theme.colors.success : theme.colors.error }
        ]}>
          <Text style={styles.statusText}>
            {reward.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: reward.is_active ? theme.colors.error : theme.colors.success }
          ]}
          onPress={() => toggleRewardStatus(reward.id, reward.is_active)}
        >
          <Text style={styles.toggleButtonText}>
            {reward.is_active ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowCreateModal(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create Reward</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Reward Title</Text>
            <TextInput
              style={styles.formInput}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="e.g., Special Story Chapter"
              maxLength={100}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Describe what this reward gives..."
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Points Cost</Text>
            <TextInput
              style={styles.formInput}
              value={formData.points_cost.toString()}
              onChangeText={(text) => {
                const points = parseInt(text) || 0;
                setFormData(prev => ({ ...prev, points_cost: points }));
              }}
              placeholder="100"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Reward Type</Text>
            <View style={styles.typeSelector}>
              {[
                { key: 'badge', label: 'Badge', emoji: '🏆' },
                { key: 'special_chapter', label: 'Special Chapter', emoji: '📚' },
                { key: 'streak_boost', label: 'Streak Boost', emoji: '⚡' },
                { key: 'real_reward', label: 'Real Reward', emoji: '🎁' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeOption,
                    formData.type === type.key && styles.typeOptionSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type: type.key as any }))}
                >
                  <Text style={styles.typeEmoji}>{type.emoji}</Text>
                  <Text style={[
                    styles.typeLabel,
                    formData.type === type.key && styles.typeLabelSelected
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowCreateModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.createButton, isCreating && styles.createButtonDisabled]}
            onPress={handleCreateReward}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create Reward</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
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
        <Text style={styles.title}>Rewards Management</Text>
        <Text style={styles.subtitle}>
          Create and manage rewards for your children
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {rewards.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>🎯 No rewards yet</Text>
            <Text style={styles.emptyText}>
              Create your first reward to motivate your children!
            </Text>
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createFirstButtonText}>Create First Reward</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.rewardsList}>
            {rewards.map(renderRewardCard)}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {renderCreateModal()}
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
    marginBottom: theme.spacing.lg,
  },
  createFirstButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rewardsList: {
    padding: theme.spacing.lg,
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
    backgroundColor: theme.colors.primary,
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
  toggleButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fabButton: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
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
  fabText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  formSection: {
    marginBottom: theme.spacing.lg,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  formInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  typeOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  typeOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  typeLabel: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    flex: 2,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
