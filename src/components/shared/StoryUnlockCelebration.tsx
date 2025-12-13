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
  // Dramatic dark overlay with depth
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Grand celebration container with magical aesthetics
  container: {
    width: '92%',
    maxWidth: 420,
    backgroundColor: theme.colors.surface,
    borderRadius: 40,
    padding: 0,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 24,
    borderWidth: 4,
    borderColor: 'rgba(108, 92, 231, 0.2)',
    overflow: 'hidden',
  },
  content: {
    padding: theme.spacing.xl * 1.5,
    alignItems: 'center',
  },
  celebrationHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: theme.spacing.lg,
  },
  celebrationTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  // Beautiful story card with depth
  storyDetails: {
    width: '100%',
    backgroundColor: 'rgba(108, 92, 231, 0.06)',
    borderRadius: 28,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderWidth: 3,
    borderColor: 'rgba(108, 92, 231, 0.15)',
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  worldEmoji: {
    fontSize: 56,
    marginRight: theme.spacing.lg,
    marginTop: -4,
  },
  storyInfo: {
    flex: 1,
  },
  chapterNumber: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  worldBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  worldBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  // Dramatic action buttons
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    width: '100%',
  },
  readNowButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  readNowText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  laterButton: {
    flex: 1,
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
    borderWidth: 3,
    borderColor: 'rgba(108, 92, 231, 0.2)',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 24,
    alignItems: 'center',
  },
  laterText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  motivationalText: {
    fontSize: 17,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
