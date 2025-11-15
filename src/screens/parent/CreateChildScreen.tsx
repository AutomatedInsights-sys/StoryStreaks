import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme, getStoryWorldColors } from '../../utils/theme';
import { useAuth } from '../../contexts/AuthContext';
import { ParentStackParamList, StoryWorld, CreateChildForm } from '../../types';

type CreateChildScreenNavigationProp = StackNavigationProp<ParentStackParamList, 'CreateChild'>;

const STORY_WORLDS: { value: StoryWorld; label: string; description: string; emoji: string }[] = [
  {
    value: 'magical_forest',
    label: 'Magical Forest',
    description: 'Enchanted woods with fairies, talking animals, and magical creatures',
    emoji: '🌲',
  },
  {
    value: 'space_adventure',
    label: 'Space Adventure',
    description: 'Journey through galaxies with aliens, robots, and cosmic mysteries',
    emoji: '🚀',
  },
  {
    value: 'underwater_kingdom',
    label: 'Underwater Kingdom',
    description: 'Dive deep into ocean adventures with mermaids and sea creatures',
    emoji: '🐠',
  },
];

const PROFILE_MODES: { value: 'shared' | 'independent'; label: string; description: string; icon: string }[] = [
  {
    value: 'shared',
    label: 'Shared with Parent Profile',
    description: 'Use the parent profile to complete chores and read stories together.',
    icon: '👨‍👧',
  },
  {
    value: 'independent',
    label: 'Separate Child Profile',
    description: 'Give your child their own login so they can access the app on their device.',
    icon: '📱',
  },
];

export default function CreateChildScreen() {
  const navigation = useNavigation<CreateChildScreenNavigationProp>();
  const { createChild } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateChildForm>({
    name: '',
    age: 0,
    world_theme: 'magical_forest',
    profile_mode: 'independent',
  });

  const [errors, setErrors] = useState<Partial<CreateChildForm>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateChildForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.age || formData.age < 4 || formData.age > 10) {
      newErrors.age = 'Age must be between 4 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getAgeBracket = (age: number): '4-6' | '7-8' | '9-10' => {
    if (age >= 4 && age <= 6) return '4-6';
    if (age >= 7 && age <= 8) return '7-8';
    return '9-10';
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await createChild({
        name: formData.name.trim(),
        age: formData.age,
        world_theme: formData.world_theme,
        profile_mode: formData.profile_mode,
      });

      if (result.error) {
        Alert.alert('Error', result.error);
        return;
      }

      Alert.alert(
        'Success!',
        `${formData.name}'s profile has been created successfully!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating child:', error);
      Alert.alert('Error', 'Failed to create child profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof CreateChildForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Add New Child</Text>
          <Text style={styles.subtitle}>Create a profile for your child to start their adventure</Text>
        </View>

        <View style={styles.form}>
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Child's Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              placeholder="Enter your child's name"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Age Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              style={[styles.input, errors.age && styles.inputError]}
              value={formData.age ? formData.age.toString() : ''}
              onChangeText={(text) => {
                const age = parseInt(text) || 0;
                updateFormData('age', age);
              }}
              placeholder="Enter age (4-10)"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              maxLength={2}
            />
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
            <Text style={styles.helperText}>
              Age determines the complexity of stories and chores
            </Text>
          </View>

          {/* Profile Mode Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Profile Type *</Text>
            <Text style={styles.helperText}>
              Choose whether this child will use the parent profile or have their own login.
            </Text>

            {PROFILE_MODES.map(mode => {
              const isSelected = formData.profile_mode === mode.value;
              return (
                <TouchableOpacity
                  key={mode.value}
                  style={[
                    styles.profileModeOption,
                    isSelected && styles.profileModeOptionSelected,
                  ]}
                  onPress={() => updateFormData('profile_mode', mode.value)}
                >
                  <View style={styles.profileModeContent}>
                    <Text style={styles.profileModeIcon}>{mode.icon}</Text>
                    <View style={styles.profileModeInfo}>
                      <Text
                        style={[
                          styles.profileModeLabel,
                          isSelected && styles.profileModeLabelSelected,
                        ]}
                      >
                        {mode.label}
                      </Text>
                      <Text style={styles.profileModeDescription}>{mode.description}</Text>
                    </View>
                  </View>
                  <View style={styles.radioButton}>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={24} color={theme.colors.textSecondary} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* World Theme Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adventure World *</Text>
            <Text style={styles.helperText}>
              Choose the magical world where your child's stories will take place
            </Text>
            
            {STORY_WORLDS.map((world) => {
              const isSelected = formData.world_theme === world.value;
              const worldColors = getStoryWorldColors(world.value);
              
              return (
                <TouchableOpacity
                  key={world.value}
                  style={[
                    styles.worldOption,
                    isSelected && { 
                      borderColor: worldColors.primary,
                      backgroundColor: worldColors.background,
                    }
                  ]}
                  onPress={() => updateFormData('world_theme', world.value)}
                >
                  <View style={styles.worldHeader}>
                    <Text style={styles.worldEmoji}>{world.emoji}</Text>
                    <View style={styles.worldInfo}>
                      <Text style={[
                        styles.worldLabel,
                        isSelected && { color: worldColors.primary }
                      ]}>
                        {world.label}
                      </Text>
                      <Text style={styles.worldDescription}>
                        {world.description}
                      </Text>
                    </View>
                    <View style={styles.radioButton}>
                      {isSelected && (
                        <Ionicons 
                          name="checkmark-circle" 
                          size={24} 
                          color={worldColors.primary} 
                        />
                      )}
                      {!isSelected && (
                        <Ionicons 
                          name="ellipse-outline" 
                          size={24} 
                          color={theme.colors.textSecondary} 
                        />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Preview Card */}
          {formData.name && formData.age > 0 && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Profile Preview</Text>
              <View style={styles.previewContent}>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName}>{formData.name}</Text>
                  <Text style={styles.previewAge}>Age {formData.age} • {getAgeBracket(formData.age)}</Text>
                  <Text style={styles.previewWorld}>
                    {STORY_WORLDS.find(w => w.value === formData.world_theme)?.label}
                  </Text>
                  <Text style={styles.previewProfileMode}>
                    {formData.profile_mode === 'independent'
                      ? 'Separate child profile enabled'
                      : 'Uses parent profile for app access'}
                  </Text>
                </View>
                <View style={styles.previewStats}>
                  <View style={styles.previewStat}>
                    <Text style={styles.previewStatValue}>0</Text>
                    <Text style={styles.previewStatLabel}>Streak</Text>
                  </View>
                  <View style={styles.previewStat}>
                    <Text style={styles.previewStatValue}>0</Text>
                    <Text style={styles.previewStatLabel}>Points</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.createButtonText}>Create Profile</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
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
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
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
  worldOption: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  worldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  worldEmoji: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  worldInfo: {
    flex: 1,
  },
  worldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  worldDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  radioButton: {
    marginLeft: theme.spacing.md,
  },
  profileModeOption: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileModeOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  profileModeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: theme.spacing.md,
  },
  profileModeIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  profileModeInfo: {
    flex: 1,
  },
  profileModeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  profileModeLabelSelected: {
    color: theme.colors.primary,
  },
  profileModeDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  previewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.md,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  previewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  previewAge: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  previewWorld: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  previewProfileMode: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  previewStats: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  previewStat: {
    alignItems: 'center',
  },
  previewStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  previewStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  createButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    gap: theme.spacing.sm,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
