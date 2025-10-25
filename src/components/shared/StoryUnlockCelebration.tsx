import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { theme } from '../../utils/theme';

interface StoryUnlockCelebrationProps {
  visible: boolean;
  chapterTitle: string;
  chapterNumber: number;
  worldTheme: string;
  onClose: () => void;
  onReadNow: () => void;
}

export default function StoryUnlockCelebration({
  visible,
  chapterTitle,
  chapterNumber,
  worldTheme,
  onClose,
  onReadNow,
}: StoryUnlockCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start confetti immediately
      // Scale and fade in animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Bounce animation for the title
      Animated.sequence([
        Animated.delay(500),
        Animated.spring(bounceAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 4,
        }),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      bounceAnim.setValue(0);
    }
  }, [visible]);

  const getWorldThemeEmoji = (theme: string) => {
    switch (theme) {
      case 'magical_forest': return '🌲';
      case 'space_adventure': return '🚀';
      case 'underwater_kingdom': return '🐠';
      default: return '📚';
    }
  };

  const getWorldThemeColor = (theme: string) => {
    switch (theme) {
      case 'magical_forest': return '#4CAF50';
      case 'space_adventure': return '#2196F3';
      case 'underwater_kingdom': return '#00BCD4';
      default: return theme.colors.primary;
    }
  };

  const getCelebrationEmojis = () => {
    const emojis = ['🎉', '✨', '🌟', '🎊', '🎈', '🎁', '🏆', '⭐'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti Animation */}
        {visible && (
          <ConfettiCannon
            count={200}
            origin={{ x: Dimensions.get('window').width / 2, y: -10 }}
            fadeOut={true}
            autoStart={true}
            explosionSpeed={350}
            fallSpeed={2300}
            colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']}
          />
        )}

        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.content}>
            {/* Celebration Header */}
            <Animated.View
              style={[
                styles.celebrationHeader,
                {
                  transform: [
                    {
                      scale: bounceAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 1.2, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.celebrationEmoji}>
                {getCelebrationEmojis()}
              </Text>
              <Text style={styles.celebrationTitle}>New Story Unlocked!</Text>
            </Animated.View>

            {/* Story Details */}
            <View style={styles.storyDetails}>
              <View style={styles.storyHeader}>
                <Text style={styles.worldEmoji}>
                  {getWorldThemeEmoji(worldTheme)}
                </Text>
                <View style={styles.storyInfo}>
                  <Text style={styles.chapterNumber}>
                    Chapter {chapterNumber}
                  </Text>
                  <Text style={styles.chapterTitle}>{chapterTitle}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.worldBadge,
                  { backgroundColor: getWorldThemeColor(worldTheme) },
                ]}
              >
                <Text style={styles.worldBadgeText}>
                  {worldTheme.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.readNowButton}
                onPress={onReadNow}
              >
                <Text style={styles.readNowText}>📖 Read Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.laterButton}
                onPress={onClose}
              >
                <Text style={styles.laterText}>Later</Text>
              </TouchableOpacity>
            </View>

            {/* Motivational Message */}
            <Text style={styles.motivationalText}>
              Keep completing chores to unlock more amazing stories! 🌟
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  content: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  celebrationHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  celebrationEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  storyDetails: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  worldEmoji: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  storyInfo: {
    flex: 1,
  },
  chapterNumber: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    lineHeight: 24,
  },
  worldBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
  },
  worldBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  readNowButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  readNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  laterButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  laterText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  motivationalText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
