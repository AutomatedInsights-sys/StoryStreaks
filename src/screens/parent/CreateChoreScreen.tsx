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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { theme } from '../../utils/theme';
import { CreateChoreForm, Child } from '../../types';

export default function CreateChoreScreen() {
  const navigation = useNavigation();
  const { user, children } = useAuth();
  const [loading, setLoading] = useState(false);
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
      Alert.alert('Error', 'Only parents can create chores');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('chores')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          points: formData.points,
          recurrence: formData.recurrence,
          assigned_to: formData.assigned_to,
          deadline: formData.deadline?.toISOString(),
          parent_id: user.id,
        });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Success!',
        'Chore created successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating chore:', error);
      Alert.alert('Error', 'Failed to create chore. Please try again.');
    } finally {
      setLoading(false);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create New Chore</Text>
          <Text style={styles.subtitle}>
            Set up a chore for your children to complete
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
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.surface} size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Create Chore</Text>
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
