import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NotificationService } from '../../services/notificationService';
import { Notification } from '../../types';
import { theme } from '../../utils/theme';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      // This would need to be passed from the parent component or context
      // For now, we'll use a placeholder
      const userId = 'placeholder-user-id'; // This should come from auth context
      const data = await NotificationService.getNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.is_read) {
      await NotificationService.markAsRead(notification.id);
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    }
  };

  const renderNotification = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationCard,
        !notification.is_read && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(notification)}
    >
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <View style={styles.notificationMeta}>
          <Text style={styles.notificationDate}>
            {new Date(notification.created_at).toLocaleDateString()}
          </Text>
          {!notification.is_read && <View style={styles.unreadDot} />}
        </View>
      </View>
      <Text style={styles.notificationMessage}>{notification.message}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>📭 No notifications</Text>
            <Text style={styles.emptyText}>
              You'll receive notifications when chores are completed or approved.
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map(renderNotification)}
          </View>
        )}
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
  },
  scrollView: {
    flex: 1,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  notificationsList: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  notificationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  notificationDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  notificationMessage: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
});
