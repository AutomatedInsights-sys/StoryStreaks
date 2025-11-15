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
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
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
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState<CreateRewardForm>({
    title: '',
    description: '',
    points_cost: 0,
    type: 'badge',
    thumbnail_url: '',
    category: '',
    fulfillment_instructions: '',
    estimated_fulfillment_time: '',
    auto_approve: false,
    is_recurring: false,
    quantity: null,
  });

  const CATEGORY_OPTIONS = [
    { key: 'experience', label: 'Experience', emoji: '🎉' },
    { key: 'treat', label: 'Treat', emoji: '🍪' },
    { key: 'screen_time', label: 'Screen Time', emoji: '🎮' },
    { key: 'special', label: 'Special', emoji: '🌟' },
  ];
  const REWARD_PHOTO_BUCKET = 'reward-photos';

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      points_cost: 0,
      type: 'badge',
      thumbnail_url: '',
      category: '',
      fulfillment_instructions: '',
      estimated_fulfillment_time: '',
      auto_approve: false,
      is_recurring: false,
      quantity: null,
    });
    setEditingReward(null);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, thumbnail_url: '' }));
  };

  const handleSelectImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'We need access to your photo library to add a reward photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      if (!asset.uri) {
        Alert.alert('Error', 'Failed to read selected photo. Please try again.');
        return;
      }

      setIsUploadingImage(true);

      const fileName = `reward_${user?.id || 'parent'}_${Date.now()}.jpg`;
      const formDataUpload = new FormData();
      formDataUpload.append('file', {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: fileName,
      } as any);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(REWARD_PHOTO_BUCKET)
        .upload(fileName, formDataUpload, {
          contentType: asset.mimeType || 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError || !uploadData) {
        console.error('Error uploading reward photo:', uploadError);
        Alert.alert('Error', 'Failed to upload photo. Please try again.');
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from(REWARD_PHOTO_BUCKET)
        .getPublicUrl(uploadData.path);

      if (!publicUrlData?.publicUrl) {
        Alert.alert('Error', 'Failed to retrieve photo URL. Please try again.');
        return;
      }

      setFormData(prev => ({ ...prev, thumbnail_url: publicUrlData.publicUrl }));
    } catch (error) {
      console.error('Error selecting reward photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

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

  const handleSubmitReward = async () => {
    if (!user?.id) return;

    if (!formData.title.trim() || !formData.description.trim()) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    if (formData.points_cost <= 0) {
      Alert.alert('Error', 'Points cost must be greater than 0');
      return;
    }

    setIsSaving(true);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      points_cost: formData.points_cost,
      type: formData.type,
      parent_id: user.id,
      is_active: editingReward ? editingReward.is_active : true,
      thumbnail_url: formData.thumbnail_url?.trim() || null,
      category: formData.category?.trim() || null,
      fulfillment_instructions: formData.fulfillment_instructions?.trim() || null,
      estimated_fulfillment_time: formData.estimated_fulfillment_time?.trim() || null,
      auto_approve: formData.auto_approve,
      is_recurring: formData.is_recurring,
      quantity: formData.quantity !== null && formData.quantity !== undefined
        ? Math.max(formData.quantity, 0)
        : null,
    };

    try {
      if (editingReward) {
        const { error } = await supabase
          .from('rewards')
          .update(payload)
          .eq('id', editingReward.id);

        if (error) {
          console.error('Error updating reward:', error);
          Alert.alert('Error', 'Failed to update reward');
          return;
        }

        Alert.alert('Success', 'Reward updated successfully!');
      } else {
        const { error } = await supabase
          .from('rewards')
          .insert(payload);

        if (error) {
          console.error('Error creating reward:', error);
          Alert.alert('Error', 'Failed to create reward');
          return;
        }

        Alert.alert('Success', 'Reward created successfully!');
      }

      setShowCreateModal(false);
      resetForm();
      fetchRewards();
    } catch (error) {
      console.error('Error saving reward:', error);
      Alert.alert('Error', 'Failed to save reward');
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      title: reward.title,
      description: reward.description,
      points_cost: reward.points_cost,
      type: reward.type,
      thumbnail_url: reward.thumbnail_url || '',
      category: reward.category || '',
      fulfillment_instructions: reward.fulfillment_instructions || '',
      estimated_fulfillment_time: reward.estimated_fulfillment_time || '',
      auto_approve: !!reward.auto_approve,
      is_recurring: !!reward.is_recurring,
      quantity: reward.quantity ?? null,
    });
    setShowCreateModal(true);
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
      {reward.thumbnail_url ? (
        <Image
          source={{ uri: reward.thumbnail_url }}
          style={styles.rewardImage}
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
        <View style={styles.rewardCost}>
          <Text style={styles.costText}>{reward.points_cost} pts</Text>
        </View>
      </View>

      <Text style={styles.rewardDescription}>{reward.description}</Text>

      {reward.fulfillment_instructions ? (
        <View style={styles.fulfillmentSection}>
          <Text style={styles.fulfillmentLabel}>Parent Notes</Text>
          <Text style={styles.fulfillmentText}>
            {reward.fulfillment_instructions}
          </Text>
        </View>
      ) : null}

        {!reward.is_recurring && reward.quantity !== null && reward.quantity !== undefined ? (
          <Text style={styles.quantityText}>
            Remaining redemptions: {Math.max(reward.quantity, 0)}
          </Text>
        ) : null}

      {reward.estimated_fulfillment_time ? (
        <View style={styles.fulfillmentSection}>
          <Text style={styles.fulfillmentLabel}>Estimated Fulfillment</Text>
          <Text style={styles.fulfillmentText}>
            {reward.estimated_fulfillment_time}
          </Text>
        </View>
      ) : null}

      <View style={styles.rewardFooter}>
        <View style={styles.footerLeft}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: reward.is_active ? theme.colors.success : theme.colors.error }
          ]}>
            <Text style={styles.statusText}>
              {reward.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
          {reward.auto_approve ? (
            <View style={[styles.statusBadge, styles.autoApproveBadge]}>
              <Text style={styles.statusText}>Auto-Approve</Text>
            </View>
          ) : null}
            {reward.is_recurring ? (
              <View style={[styles.statusBadge, styles.recurringBadge]}>
                <Text style={styles.statusText}>Recurring</Text>
              </View>
            ) : null}
        </View>

        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(reward)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
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
            onPress={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingReward ? 'Edit Reward' : 'Create Reward'}
          </Text>
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
            <Text style={styles.formLabel}>Reward Photo</Text>
            <View style={styles.imagePreviewWrapper}>
              {formData.thumbnail_url ? (
                <Image
                  source={{ uri: formData.thumbnail_url }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>No photo selected</Text>
                </View>
              )}
            </View>
            <View style={styles.imageButtonsRow}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={handleSelectImage}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.imageButtonText}>Choose Photo</Text>
                )}
              </TouchableOpacity>
              {formData.thumbnail_url ? (
                <TouchableOpacity
                  style={styles.imageRemoveButton}
                  onPress={handleRemoveImage}
                >
                  <Text style={styles.imageRemoveText}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <Text style={styles.helperText}>
              Optional photo to help kids visualize this reward.
            </Text>
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
            <Text style={styles.formLabel}>Category</Text>
            <View style={styles.typeSelector}>
              {CATEGORY_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.typeOption,
                    formData.category === option.key && styles.typeOptionSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, category: option.key }))}
                >
                  <Text style={styles.typeEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.typeLabel,
                    formData.category === option.key && styles.typeLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Fulfillment Notes</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={formData.fulfillment_instructions}
              onChangeText={(text) => setFormData(prev => ({ ...prev, fulfillment_instructions: text }))}
              placeholder="Instructions for how to fulfill this reward..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Estimated Fulfillment Time</Text>
            <TextInput
              style={styles.formInput}
              value={formData.estimated_fulfillment_time}
              onChangeText={(text) => setFormData(prev => ({ ...prev, estimated_fulfillment_time: text }))}
              placeholder="Same day, Weekend, etc."
            />
          </View>

          <View style={[styles.formSection, styles.inlineSection]}>
            <View>
              <Text style={styles.formLabel}>Auto-Approve</Text>
              <Text style={styles.helperText}>
                Automatically approve this reward when redeemed.
              </Text>
            </View>
            <Switch
              value={formData.auto_approve}
              onValueChange={(value) => setFormData(prev => ({ ...prev, auto_approve: value }))}
              trackColor={{ false: theme.colors.border, true: theme.colors.success }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.formSection, styles.inlineSection]}>
            <View>
              <Text style={styles.formLabel}>Recurring Reward</Text>
              <Text style={styles.helperText}>
                Keep this reward available after it’s redeemed.
              </Text>
            </View>
            <Switch
              value={formData.is_recurring}
              onValueChange={(value) => setFormData(prev => ({ ...prev, is_recurring: value }))}
              trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Quantity (optional)</Text>
            <TextInput
              style={styles.formInput}
              value={formData.quantity !== null && formData.quantity !== undefined
                ? String(formData.quantity)
                : ''}
              onChangeText={(text) => {
                const parsed = parseInt(text || '0', 10);
                setFormData(prev => ({
                  ...prev,
                  quantity: Number.isNaN(parsed) ? null : Math.max(parsed, 0),
                }));
              }}
              placeholder="Leave blank for unlimited"
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
            onPress={() => {
              setShowCreateModal(false);
              resetForm();
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.createButton, isSaving && styles.createButtonDisabled]}
            onPress={handleSubmitReward}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>
                {editingReward ? 'Save Changes' : 'Create Reward'}
              </Text>
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
              onPress={openCreateModal}
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
        onPress={openCreateModal}
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
    shadowRadius: 6,
    elevation: 3,
    gap: theme.spacing.md,
  },
  rewardImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
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
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  rewardTitleText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
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
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'capitalize',
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
  },
  fulfillmentSection: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
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
  quantityText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  rewardFooter: {
    gap: theme.spacing.sm,
  },
  footerLeft: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
  autoApproveBadge: {
    backgroundColor: theme.colors.warning,
  },
  recurringBadge: {
    backgroundColor: theme.colors.secondary,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  editButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
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
  helperText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs / 2,
  },
  imagePreviewWrapper: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  imageButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  imageButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  imageRemoveButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  imageRemoveText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
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
  inlineSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
