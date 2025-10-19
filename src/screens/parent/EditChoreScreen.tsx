import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { theme } from '../../utils/theme';
import { CreateChoreForm, Child, Chore } from '../../types';

interface RouteParams {
  choreId: string;
}

export default function EditChoreScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, children } = useAuth();
  const { choreId } = route.params as RouteParams;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chore, setChore] = useState<Chore | null>(null);
  const [formData, setFormData] = useState<CreateChoreForm>({
    title: '',
    description: '',
    points: 10,
    recurrence: 'daily',
    assigned_to: [],
    deadline: undefined,
  });

  const [errors, setErrors] = useState<Partial<CreateChoreForm>>({});

  const recurrenceOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'one-time', label: 'One-time' },
  ];

  useEffect(() => {
    loadChore();
  }, [choreId]);

  const loadChore = async () => {
    if (!user || user.role !== 'parent') {
      return;
    }

    try {
      const { data: choreData, error } = await supabase
        .from('chores')
        .select('*')
        .eq('id', choreId)
        .eq('parent_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      setChore(choreData);
      setFormData({
        title: choreData.title,
        description: choreData.description,
        points: choreData.points,
        recurrence: choreData.recurrence,
        assigned_to: choreData.assigned_to || [],
        deadline: choreData.deadline ? new Date(choreData.deadline) : undefined,
      });
    } catch (error) {
      console.error('Error loading chore:', error);
      Alert.alert('Error', 'Failed to load chore. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateChoreForm> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.points < 1 || formData.points > 100) {
      newErrors.points = 'Points must be between 1 and 100';
    }

    if (formData.assigned_to.length === 0) {
      newErrors.assigned_to = 'Please assign to at least one child';
    }

    if (formData.recurrence === 'one-time' && !formData.deadline) {
      newErrors.deadline = 'Deadline is required for one-time chores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user || user.role !== 'parent') {
      Alert.alert('Error', 'Only parents can edit chores');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('chores')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          points: formData.points,
          recurrence: formData.recurrence,
          assigned_to: formData.assigned_to,
          deadline: formData.deadline?.toISOString(),
        })
        .eq('id', choreId);

      if (error) {
        throw error;
      }

      Alert.alert(
        'Success!',
        'Chore updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating chore:', error);
      Alert.alert('Error', 'Failed to update chore. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleChildAssignment = (childId: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_to: prev.assigned_to.includes(childId)
        ? prev.assigned_to.filter(id => id !== childId)
        : [...prev.assigned_to, childId],
    }));
  };

  const setDeadline = (days: number) => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    setFormData(prev => ({ ...prev, deadline }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading chore...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chore) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Chore not found</Text>
          <Text style={styles.errorSubtitle}>
            This chore may have been deleted or you don't have permission to edit it.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Chore</Text>
          <Text style={styles.subtitle}>
            Update the details for "{chore.title}"
          </Text>
        </View>

        <View style={styles.form}>
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Chore Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="e.g., Clean your room"
              placeholderTextColor={theme.colors.textSecondary}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Describe what needs to be done..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          {/* Points Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Points Reward *</Text>
            <TextInput
              style={[styles.input, errors.points && styles.inputError]}
              value={formData.points.toString()}
              onChangeText={(text) => {
                const points = parseInt(text) || 0;
                setFormData(prev => ({ ...prev, points }));
              }}
              placeholder="10"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
            />
            {errors.points && <Text style={styles.errorText}>{errors.points}</Text>}
            <Text style={styles.helperText}>Points children earn for completing this chore</Text>
          </View>

          {/* Recurrence Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recurrence *</Text>
            <View style={styles.recurrenceContainer}>
              {recurrenceOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.recurrenceOption,
                    formData.recurrence === option.value && styles.recurrenceOptionSelected,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, recurrence: option.value as any }))}
                >
                  <Text
                    style={[
                      styles.recurrenceText,
                      formData.recurrence === option.value && styles.recurrenceTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Deadline for One-time Chores */}
          {formData.recurrence === 'one-time' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Deadline *</Text>
              <View style={styles.deadlineContainer}>
                <TouchableOpacity
                  style={styles.deadlineButton}
                  onPress={() => setDeadline(1)}
                >
                  <Text style={styles.deadlineButtonText}>Tomorrow</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deadlineButton}
                  onPress={() => setDeadline(3)}
                >
                  <Text style={styles.deadlineButtonText}>3 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deadlineButton}
                  onPress={() => setDeadline(7)}
                >
                  <Text style={styles.deadlineButtonText}>1 Week</Text>
                </TouchableOpacity>
              </View>
              {formData.deadline && (
                <Text style={styles.deadlineText}>
                  Due: {formData.deadline.toLocaleDateString()}
                </Text>
              )}
              {errors.deadline && <Text style={styles.errorText}>{errors.deadline}</Text>}
            </View>
          )}

          {/* Child Assignment */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assign to Children *</Text>
            {children.length === 0 ? (
              <Text style={styles.noChildrenText}>
                No children found. Create a child profile first.
              </Text>
            ) : (
              <View style={styles.childrenContainer}>
                {children.map((child) => (
                  <TouchableOpacity
                    key={child.id}
                    style={[
                      styles.childOption,
                      formData.assigned_to.includes(child.id) && styles.childOptionSelected,
                    ]}
                    onPress={() => toggleChildAssignment(child.id)}
                  >
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>{child.name}</Text>
                      <Text style={styles.childDetails}>
                        {child.age} years • {child.world_theme.replace('_', ' ')}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        formData.assigned_to.includes(child.id) && styles.checkboxSelected,
                      ]}
                    >
                      {formData.assigned_to.includes(child.id) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.assigned_to && <Text style={styles.errorText}>{errors.assigned_to}</Text>}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={theme.colors.surface} size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Update Chore</Text>
            )}
          </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  errorSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  form: {
    paddingHorizontal: theme.spacing.lg,
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
  textArea: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginTop: theme.spacing.xs,
  },
  helperText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: theme.spacing.xs,
  },
  recurrenceContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  recurrenceOption: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  recurrenceOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  recurrenceText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  recurrenceTextSelected: {
    color: theme.colors.surface,
  },
  deadlineContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  deadlineButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  deadlineButtonText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  deadlineText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  childrenContainer: {
    gap: theme.spacing.sm,
  },
  childOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: theme.spacing.md,
  },
  childOptionSelected: {
    backgroundColor: theme.colors.primary + '10',
    borderColor: theme.colors.primary,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  childDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
  noChildrenText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  submitButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.textSecondary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.surface,
  },
});
