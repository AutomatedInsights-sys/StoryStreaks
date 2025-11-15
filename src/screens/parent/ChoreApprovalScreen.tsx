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
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { NotificationService } from '../../services/notificationService';
import { aiStoryService } from '../../services/aiStoryService';
import { ChoreCompletion, Chore, Child } from '../../types';
import { theme } from '../../utils/theme';

interface ChoreCompletionWithDetails extends ChoreCompletion {
  chore: Chore;
  child: Child;
}

export default function ChoreApprovalScreen() {
  const { user, children, refreshChildren } = useAuth();
  const [completions, setCompletions] = useState<ChoreCompletionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCompletion, setSelectedCompletion] = useState<ChoreCompletionWithDetails | null>(null);
  const [parentNotes, setParentNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const fetchPendingCompletions = async () => {
    console.log('🔍 ChoreApproval: Fetching pending completions...');
    console.log('🔍 ChoreApproval: User ID:', user?.id);
    console.log('🔍 ChoreApproval: Children:', children);
    
    if (!user?.id || !children || children.length === 0) {
      console.log('🔍 ChoreApproval: Missing user or children data, skipping fetch');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chore_completions')
        .select(`
          *,
          chore:chores(*),
          child:children(*)
        `)
        .eq('status', 'pending')
        .in('child_id', children.map(child => child.id))
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending completions:', error);
        Alert.alert('Error', 'Failed to load pending chores');
        return;
      }

      console.log('🔍 ChoreApproval: Fetched completions:', data);
      data?.forEach((completion: any) => {
        console.log('🔍 ChoreApproval: Completion photo_url:', completion.photo_url);
      });
      setCompletions(data || []);
    } catch (error) {
      console.error('Error fetching pending completions:', error);
      Alert.alert('Error', 'Failed to load pending chores');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPendingCompletions();
    }, [user?.id])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchPendingCompletions();
  };

  const handleApprove = async (completionId: string, approved: boolean) => {
    setIsApproving(true);
    
    try {
      const { error } = await supabase
        .from('chore_completions')
        .update({
          status: approved ? 'approved' : 'rejected',
          parent_notes: parentNotes || null,
        })
        .eq('id', completionId);

      if (error) {
        console.error('Error updating completion:', error);
        Alert.alert('Error', 'Failed to update chore status');
        return;
      }

      // Update child's points if approved
      if (approved && selectedCompletion) {
        const currentPoints = selectedCompletion.child.total_points ?? 0;
        const updatedPoints = currentPoints + selectedCompletion.chore.points;

        const { error: pointsError } = await supabase
          .from('children')
          .update({
            total_points: updatedPoints,
          })
          .eq('id', selectedCompletion.child_id);

        if (pointsError) {
          console.error('Error updating points:', pointsError);
        }

        await refreshChildren();

        // Generate story for approved chore
        try {
          console.log('📚 Generating story for approved chore:', completionId);
          const newChapter = await aiStoryService.unlockStoryForChores(
            selectedCompletion.child_id,
            [completionId]
          );
          
          if (newChapter) {
            console.log('📚 Story generated successfully:', newChapter.title);
          } else {
            console.warn('📚 Story generation failed, but chore was approved');
          }
        } catch (error) {
          console.error('📚 Story generation error:', error);
          // Don't fail the approval if story generation fails
        }
      }

      // Send notification to child
      if (selectedCompletion) {
        await NotificationService.notifyChoreApproval(
          selectedCompletion.chore_id,
          selectedCompletion.child_id,
          approved,
          parentNotes || undefined
        );
      }

      Alert.alert(
        'Success',
        `Chore ${approved ? 'approved' : 'rejected'} successfully`,
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedCompletion(null);
              setParentNotes('');
              fetchPendingCompletions();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error updating completion:', error);
      Alert.alert('Error', 'Failed to update chore status');
    } finally {
      setIsApproving(false);
    }
  };

  const renderCompletionCard = (completion: ChoreCompletionWithDetails) => (
    <TouchableOpacity
      key={completion.id}
      style={styles.completionCard}
      onPress={() => setSelectedCompletion(completion)}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.choreTitle}>{completion.chore.title}</Text>
          <Text style={styles.childName}>by {completion.child.name}</Text>
        </View>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsText}>{completion.chore.points} pts</Text>
        </View>
      </View>
      
      <Text style={styles.choreDescription}>{completion.chore.description}</Text>
      
      <View style={styles.cardFooter}>
        <Text style={styles.completedAt}>
          Completed: {new Date(completion.completed_at).toLocaleDateString()}
        </Text>
        {completion.photo_url && (
          <View style={styles.photoIndicator}>
            <Text style={styles.photoText}>📷 Photo attached</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => (
    <Modal
      visible={!!selectedCompletion}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => {
              setSelectedCompletion(null);
              setParentNotes('');
            }}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Review Chore</Text>
          <View style={styles.placeholder} />
        </View>

        {selectedCompletion && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>{selectedCompletion.chore.title}</Text>
              <Text style={styles.detailChild}>by {selectedCompletion.child.name}</Text>
              <Text style={styles.detailDescription}>{selectedCompletion.chore.description}</Text>
              
              <View style={styles.detailStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Points</Text>
                  <Text style={styles.statValue}>{selectedCompletion.chore.points}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Completed</Text>
                  <Text style={styles.statValue}>
                    {new Date(selectedCompletion.completed_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {selectedCompletion.photo_url && (
                <View style={styles.photoSection}>
                  <Text style={styles.photoSectionTitle}>Completion Photo</Text>
                  <Image 
                    source={{ 
                      uri: selectedCompletion.photo_url,
                      cache: 'force-cache'
                    }} 
                    style={styles.photo}
                    resizeMode="cover"
                    onError={(error) => {
                      console.error('📸 Error loading photo:', error);
                      console.error('📸 Photo URL:', selectedCompletion.photo_url);
                      console.error('📸 Error details:', error.nativeEvent);
                    }}
                    onLoad={() => {
                      console.log('📸 Photo loaded successfully:', selectedCompletion.photo_url);
                    }}
                    onLoadStart={() => {
                      console.log('📸 Starting to load photo:', selectedCompletion.photo_url);
                    }}
                    onLoadEnd={() => {
                      console.log('📸 Finished loading photo:', selectedCompletion.photo_url);
                    }}
                  />
                </View>
              )}

              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Notes (optional)</Text>
                <TextInput
                  style={styles.notesInput}
                  value={parentNotes}
                  onChangeText={setParentNotes}
                  placeholder="Add feedback or notes for your child..."
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          </ScrollView>
        )}

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleApprove(selectedCompletion!.id, false)}
            disabled={isApproving}
          >
            {isApproving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Reject</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(selectedCompletion!.id, true)}
            disabled={isApproving}
          >
            {isApproving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Approve</Text>
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
          <Text style={styles.loadingText}>Loading pending chores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Chore Approval</Text>
        <Text style={styles.subtitle}>
          {completions.length} chore{completions.length !== 1 ? 's' : ''} pending approval
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {completions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>🎉 All caught up!</Text>
            <Text style={styles.emptyText}>
              No chores are currently pending approval.
            </Text>
          </View>
        ) : (
          <View style={styles.completionsList}>
            {completions.map(renderCompletionCard)}
          </View>
        )}
      </ScrollView>

      {renderDetailModal()}
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
  },
  completionsList: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  completionCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  choreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  childName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  pointsContainer: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
  },
  pointsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  choreDescription: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedAt: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  photoIndicator: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
  },
  photoText: {
    color: '#fff',
    fontSize: 12,
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
  detailCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  detailChild: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  detailDescription: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  detailStats: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  photoSection: {
    marginBottom: theme.spacing.lg,
  },
  photoSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
  },
  notesSection: {
    marginBottom: theme.spacing.lg,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  approveButton: {
    backgroundColor: theme.colors.success,
  },
  rejectButton: {
    backgroundColor: theme.colors.error,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
