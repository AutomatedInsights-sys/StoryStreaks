import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme, getStoryWorldColors } from '../../utils/theme';
import { StoryWorld } from '../../types';

interface ThemeSelectionModalProps {
  visible: boolean;
  childName: string;
  onSelectTheme: (theme: StoryWorld) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

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

export default function ThemeSelectionModal({
  visible,
  childName,
  onSelectTheme,
  onClose,
  isLoading = false,
}: ThemeSelectionModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<StoryWorld | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedTheme) return;
    
    setIsSubmitting(true);
    try {
      await onSelectTheme(selectedTheme);
    } finally {
      setIsSubmitting(false);
      setSelectedTheme(null);
    }
  };

  const handleClose = () => {
    setSelectedTheme(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>New Adventure Awaits!</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.celebrationSection}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>
              Congratulations, {childName}!
            </Text>
            <Text style={styles.celebrationText}>
              You've completed your story book! Time to pick a new adventure world for your next story.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Choose Your Next World</Text>

          <View style={styles.themesContainer}>
            {STORY_WORLDS.map((world) => {
              const isSelected = selectedTheme === world.value;
              const worldColors = getStoryWorldColors(world.value);

              return (
                <TouchableOpacity
                  key={world.value}
                  style={[
                    styles.themeOption,
                    isSelected && {
                      borderColor: worldColors.primary,
                      backgroundColor: worldColors.background,
                    },
                  ]}
                  onPress={() => setSelectedTheme(world.value)}
                  disabled={isSubmitting}
                >
                  <View style={styles.themeHeader}>
                    <Text style={styles.themeEmoji}>{world.emoji}</Text>
                    <View style={styles.themeInfo}>
                      <Text
                        style={[
                          styles.themeLabel,
                          isSelected && { color: worldColors.primary },
                        ]}
                      >
                        {world.label}
                      </Text>
                      <Text style={styles.themeDescription}>
                        {world.description}
                      </Text>
                    </View>
                    <View style={styles.radioButton}>
                      {isSelected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={28}
                          color={worldColors.primary}
                        />
                      ) : (
                        <Ionicons
                          name="ellipse-outline"
                          size={28}
                          color={theme.colors.textSecondary}
                        />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!selectedTheme || isSubmitting) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!selectedTheme || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>
                  Start New Adventure
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  celebrationSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  celebrationText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  themesContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  themeOption: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeEmoji: {
    fontSize: 40,
    marginRight: theme.spacing.md,
  },
  themeInfo: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  themeDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  radioButton: {
    marginLeft: theme.spacing.md,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 16,
    gap: theme.spacing.sm,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});

