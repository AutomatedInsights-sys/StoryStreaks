import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { theme } from '../../utils/theme';
import { Achievement } from '../../services/achievementService';

interface AchievementCelebrationProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}

export default function AchievementCelebration({
  visible,
  achievement,
  onClose,
}: AchievementCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && achievement) {
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

      // Bounce animation for the achievement
      Animated.sequence([
        Animated.delay(500),
        Animated.spring(bounceAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 4,
        }),
      ]).start();

      // Rotate animation for the icon
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        { iterations: 3 }
      ).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      bounceAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [visible, achievement]);

  if (!achievement) return null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'chores': return '#4CAF50';
      case 'reading': return '#2196F3';
      case 'streak': return '#FF9800';
      case 'special': return '#9C27B0';
      default: return theme.colors.primary;
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'chores': return '🧹';
      case 'reading': return '📚';
      case 'streak': return '🔥';
      case 'special': return '⭐';
      default: return '🏆';
    }
  };

  const getCelebrationMessage = (category: string) => {
    switch (category) {
      case 'chores': return 'Amazing job with your chores!';
      case 'reading': return 'Fantastic reading progress!';
      case 'streak': return 'Incredible consistency!';
      case 'special': return 'Outstanding achievement!';
      default: return 'Congratulations!';
    }
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
            count={150}
            origin={{ x: Dimensions.get('window').width / 2, y: -10 }}
            fadeOut={true}
            autoStart={true}
            explosionSpeed={300}
            fallSpeed={2000}
            colors={[getCategoryColor(achievement.category), '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']}
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
            {/* Achievement Header */}
            <Animated.View
              style={[
                styles.achievementHeader,
                {
                  transform: [
                    {
                      scale: bounceAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 1.1, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.celebrationTitle}>Achievement Unlocked!</Text>
              <Text style={styles.celebrationMessage}>
                {getCelebrationMessage(achievement.category)}
              </Text>
            </Animated.View>

            {/* Achievement Details */}
            <View style={styles.achievementDetails}>
              <Animated.View
                style={[
                  styles.achievementIcon,
                  {
                    backgroundColor: getCategoryColor(achievement.category),
                    transform: [
                      {
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.achievementIconText}>{achievement.icon}</Text>
              </Animated.View>

              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>
                  {achievement.description}
                </Text>
                
                <View style={styles.categoryContainer}>
                  <Text style={styles.categoryEmoji}>
                    {getCategoryEmoji(achievement.category)}
                  </Text>
                  <Text style={styles.categoryText}>
                    {achievement.category.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Points Reward */}
            <View style={styles.pointsContainer}>
              <Text style={styles.pointsLabel}>Points Earned:</Text>
              <Text style={styles.pointsValue}>+{achievement.points_reward}</Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                { backgroundColor: getCategoryColor(achievement.category) }
              ]}
              onPress={onClose}
            >
              <Text style={styles.continueButtonText}>Awesome! 🎉</Text>
            </TouchableOpacity>

            {/* Motivational Message */}
            <Text style={styles.motivationalText}>
              Keep up the great work to unlock more achievements!
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  achievementHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  celebrationMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  achievementDetails: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  achievementIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  achievementIconText: {
    fontSize: 40,
  },
  achievementInfo: {
    alignItems: 'center',
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  achievementDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.lg,
  },
  pointsLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  continueButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 12,
    marginBottom: theme.spacing.lg,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
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
