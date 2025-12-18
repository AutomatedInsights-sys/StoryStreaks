import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme, getStoryWorldColors } from '../../utils/theme';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Child, ParentStackParamList, StoryWorld } from '../../types';

type ChildDetailScreenNavigationProp = StackNavigationProp<ParentStackParamList, 'ChildDetail'>;
type ChildDetailScreenRouteProp = RouteProp<ParentStackParamList, 'ChildDetail'>;

const STORY_WORLDS: { value: StoryWorld; label: string; emoji: string }[] = [
  { value: 'magical_forest', label: 'Magical Forest', emoji: '🌲' },
  { value: 'space_adventure', label: 'Space Adventure', emoji: '🚀' },
  { value: 'underwater_kingdom', label: 'Underwater Kingdom', emoji: '🐠' },
];

export default function ChildDetailScreen() {
  const navigation = useNavigation<ChildDetailScreenNavigationProp>();
  const route = useRoute<ChildDetailScreenRouteProp>();
  const { childId } = route.params;
  const { children, refreshChildren } = useAuth();

  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    age: 0,
    world_theme: 'magical_forest' as StoryWorld,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // First try to find child in AuthContext
    const foundChild = children.find(c => c.id === childId);
    if (foundChild) {
      setChild(foundChild);
      setEditForm({
        name: foundChild.name,
        age: foundChild.age,
        world_theme: foundChild.world_theme,
      });
      setLoading(false);
    } else {
      fetchChild();
    }
  }, [childId, children]);

  const fetchChild = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('id', childId)
        .single();

      if (error) {
        console.error('Error fetching child:', error);
        Alert.alert('Error', 'Failed to load child details');
        navigation.goBack();
        return;
      }

      setChild(data);
      setEditForm({
        name: data.name,
        age: data.age,
        world_theme: data.world_theme,
      });
    } catch (error) {
      console.error('Error fetching child:', error);
      Alert.alert('Error', 'Failed to load child details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!child) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('children')
        .update({
          name: editForm.name.trim(),
          age: editForm.age,
          age_bracket: getAgeBracket(editForm.age),
          world_theme: editForm.world_theme,
        })
        .eq('id', childId);

      if (error) {
        console.error('Error updating child:', error);
        Alert.alert('Error', 'Failed to update child profile');
        return;
      }

      // Refresh children in AuthContext
      await refreshChildren();
      
      // Update local state
      setChild(prev => prev ? {
        ...prev,
        name: editForm.name.trim(),
        age: editForm.age,
        age_bracket: getAgeBracket(editForm.age),
        world_theme: editForm.world_theme,
      } : null);

      setEditMode(false);
      Alert.alert('Success', 'Child profile updated successfully');
    } catch (error) {
      console.error('Error updating child:', error);
      Alert.alert('Error', 'Failed to update child profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!child) return;

    Alert.alert(
      'Delete Child Profile',
      `Are you sure you want to delete ${child.name}'s profile? This action cannot be undone and will remove all associated data.`,
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
                .eq('id', childId);

              if (error) {
                console.error('Error deleting child:', error);
                Alert.alert('Error', 'Failed to delete child profile');
                return;
              }

              // Refresh children in AuthContext
              await refreshChildren();
              
              Alert.alert('Success', 'Child profile deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error deleting child:', error);
              Alert.alert('Error', 'Failed to delete child profile');
            }
          },
        },
      ]
    );
  };

  const getAgeBracket = (age: number): '4-6' | '7-8' | '9-10' => {
    if (age >= 4 && age <= 6) return '4-6';
    if (age >= 7 && age <= 8) return '7-8';
    return '9-10';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading child details...</Text>
      </View>
    );
  }

  if (!child) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
        <Text style={styles.errorTitle}>Child Not Found</Text>
        <Text style={styles.errorSubtitle}>The child profile could not be loaded.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const worldColors = getStoryWorldColors(child.world_theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={[styles.headerCard, { borderLeftColor: worldColors.primary }]}>
          <View style={styles.headerContent}>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childAge}>Age {child.age} • {child.age_bracket}</Text>
              <Text style={[styles.worldTheme, { color: worldColors.primary }]}>
                {STORY_WORLDS.find(w => w.value === child.world_theme)?.emoji} {STORY_WORLDS.find(w => w.value === child.world_theme)?.label}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditMode(true)}
            >
              <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={24} color={theme.colors.warning} />
            <Text style={styles.statValue}>{child.current_streak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{child.total_points}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color={theme.colors.secondary} />
            <Text style={styles.statValue}>
              {new Date(child.created_at).toLocaleDateString()}
            </Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="list-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.actionButtonText}>View Chores</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="book-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.actionButtonText}>View Stories</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="gift-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.actionButtonText}>Rewards</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            <Text style={styles.deleteButtonText}>Delete Child Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editMode}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditMode(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Child Profile</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={editForm.name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                placeholder="Child's name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={editForm.age.toString()}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, age: parseInt(text) || 0 }))}
                placeholder="Age"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adventure World</Text>
              {STORY_WORLDS.map((world) => (
                <TouchableOpacity
                  key={world.value}
                  style={[
                    styles.worldOption,
                    editForm.world_theme === world.value && styles.worldOptionSelected
                  ]}
                  onPress={() => setEditForm(prev => ({ ...prev, world_theme: world.value }))}
                >
                  <Text style={styles.worldEmoji}>{world.emoji}</Text>
                  <Text style={styles.worldLabel}>{world.label}</Text>
                  {editForm.world_theme === world.value && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  errorSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 12,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingTop: 60,
  },
  headerCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  childAge: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  worldTheme: {
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    padding: theme.spacing.sm,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
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
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  dangerZone: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error,
    gap: theme.spacing.sm,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  cancelText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  worldOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  worldOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0F9FF',
  },
  worldEmoji: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  worldLabel: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
});
