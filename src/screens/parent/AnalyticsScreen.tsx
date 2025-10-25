import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { AnalyticsService, ParentDashboardAnalytics, ChildAnalytics } from '../../services/analyticsService';
import { AnalyticsServiceDebug } from '../../services/analyticsServiceDebug';
import { theme } from '../../utils/theme';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<ParentDashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month'>('week');

  const fetchAnalytics = async () => {
    if (!user?.id) {
      console.log('No user ID available');
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    console.log('Fetching analytics for user:', user.id);
    
    try {
      // First run debug test
      console.log('Running debug test...');
      const debugResult = await AnalyticsServiceDebug.testConnection(user.id);
      console.log('Debug result:', debugResult);
      
      if (!debugResult.success) {
        console.error('Debug test failed:', debugResult.error);
        setAnalytics(null);
        return;
      }
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Analytics request timeout')), 10000)
      );
      
      const analyticsPromise = AnalyticsService.getParentDashboardAnalytics(user.id);
      
      const data = await Promise.race([analyticsPromise, timeoutPromise]);
      console.log('Analytics data received:', data);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set analytics to null to show error state
      setAnalytics(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [user?.id])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAnalytics();
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getEngagementLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Attention';
  };

  const renderChildCard = (child: ChildAnalytics) => (
    <View key={child.child_id} style={styles.childCard}>
      <View style={styles.childHeader}>
        <View style={styles.childInfo}>
          <Text style={styles.childName}>{child.child_name}</Text>
          <Text style={styles.childLastActivity}>
            Last active: {new Date(child.last_activity).toLocaleDateString()}
          </Text>
        </View>
        <View style={[
          styles.engagementBadge,
          { backgroundColor: getEngagementColor(child.engagement_score) }
        ]}>
          <Text style={styles.engagementScore}>{child.engagement_score}</Text>
          <Text style={styles.engagementLabel}>
            {getEngagementLabel(child.engagement_score)}
          </Text>
        </View>
      </View>

      <View style={styles.childStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{child.total_chores_completed}</Text>
          <Text style={styles.statLabel}>Chores</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{child.chapters_read}</Text>
          <Text style={styles.statLabel}>Stories</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{child.current_streak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{child.total_points}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>

      {child.favorite_world_theme && (
        <View style={styles.favoriteWorld}>
          <Text style={styles.favoriteWorldLabel}>Favorite World:</Text>
          <Text style={styles.favoriteWorldText}>
            {child.favorite_world_theme.replace('_', ' ')}
          </Text>
        </View>
      )}
    </View>
  );

  const renderWeeklyChart = () => {
    if (!analytics?.weekly_activity) return null;

    const maxValue = Math.max(
      ...analytics.weekly_activity.map(d => d.chores_completed),
      ...analytics.weekly_activity.map(d => d.stories_read)
    );

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Activity</Text>
        <View style={styles.chart}>
          {analytics.weekly_activity.map((day, index) => (
            <View key={index} style={styles.chartBar}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: (day.chores_completed / maxValue) * 100,
                      backgroundColor: theme.colors.primary,
                    }
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    {
                      height: (day.stories_read / maxValue) * 100,
                      backgroundColor: '#4CAF50',
                    }
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>
                {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
            <Text style={styles.legendText}>Chores</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Stories</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analytics) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>No Data Available</Text>
          <Text style={styles.errorText}>
            Analytics will appear once your children start using the app.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchAnalytics}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <Text style={styles.subtitle}>
          Insights into your children's progress and engagement
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Stats */}
        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Overview</Text>
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewValue}>{analytics.total_children}</Text>
              <Text style={styles.overviewLabel}>Children</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewValue}>{analytics.total_chores_created}</Text>
              <Text style={styles.overviewLabel}>Chores Created</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewValue}>{analytics.total_stories_generated}</Text>
              <Text style={styles.overviewLabel}>Stories Generated</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewValue}>{analytics.overall_engagement}%</Text>
              <Text style={styles.overviewLabel}>Avg Engagement</Text>
            </View>
          </View>
        </View>

        {/* Weekly Activity Chart */}
        {renderWeeklyChart()}

        {/* Children Analytics */}
        <View style={styles.childrenSection}>
          <Text style={styles.sectionTitle}>Children Progress</Text>
          {analytics.children_analytics.map(renderChildCard)}
        </View>

        {/* Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.cardTitle}>Key Insights</Text>
          <View style={styles.insightsList}>
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>🏆</Text>
              <Text style={styles.insightText}>
                Most active: {analytics.most_active_child}
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>📈</Text>
              <Text style={styles.insightText}>
                Overall engagement: {analytics.overall_engagement}%
              </Text>
            </View>
            {analytics.least_active_child && (
              <View style={styles.insightItem}>
                <Text style={styles.insightIcon}>💡</Text>
                <Text style={styles.insightText}>
                  Consider encouraging {analytics.least_active_child} with more engaging activities
                </Text>
              </View>
            )}
          </View>
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
    padding: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  overviewCard: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  overviewStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewStat: {
    width: '48%',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  overviewLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  chartContainer: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: theme.spacing.md,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 2,
  },
  bar: {
    width: 12,
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: theme.spacing.xs,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  childrenSection: {
    margin: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  childCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  childLastActivity: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  engagementBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 16,
    alignItems: 'center',
  },
  engagementScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  engagementLabel: {
    fontSize: 10,
    color: '#fff',
  },
  childStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  favoriteWorld: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  favoriteWorldLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  favoriteWorldText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textTransform: 'capitalize',
  },
  insightsCard: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  insightsList: {
    gap: theme.spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
});
