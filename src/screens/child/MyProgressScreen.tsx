import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../utils/theme';

export default function MyProgressScreen() {
  const { currentChild } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>My Progress</Text>
      
      <View style={styles.progressCard}>
        <Text style={styles.cardTitle}>Your Achievements</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Current Streak:</Text>
          <Text style={styles.statValue}>{currentChild?.current_streak || 0} days</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Points:</Text>
          <Text style={styles.statValue}>{currentChild?.total_points || 0}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Story World:</Text>
          <Text style={styles.statValue}>
            {currentChild?.world_theme?.replace('_', ' ') || 'Not set'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
  },
  progressCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});
