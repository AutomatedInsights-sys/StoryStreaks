import { supabase } from './supabase';
import { Notification } from '../types';

export class NotificationService {
  static async createNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  static async getNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  static async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Create notification when chore completion is submitted
  static async notifyChoreCompletion(choreId: string, childId: string, parentId: string) {
    try {
      // Get chore details for notification
      const { data: chore } = await supabase
        .from('chores')
        .select('title')
        .eq('id', choreId)
        .single();

      // Get child details for notification
      const { data: child } = await supabase
        .from('children')
        .select('name')
        .eq('id', childId)
        .single();

      if (!chore || !child) return;

      return await this.createNotification({
        user_id: parentId,
        type: 'approval_request',
        title: 'Chore Completed',
        message: `${child.name} completed "${chore.title}" and is waiting for your approval.`,
        data: {
          choreId,
          childId,
          type: 'chore_completion',
        },
        is_read: false,
      });
    } catch (error) {
      console.error('Error creating chore completion notification:', error);
      return null;
    }
  }

  // Create notification when chore is approved/rejected
  static async notifyChoreApproval(choreId: string, childId: string, approved: boolean, parentNotes?: string) {
    try {
      // Get chore details for notification
      const { data: chore } = await supabase
        .from('chores')
        .select('title')
        .eq('id', choreId)
        .single();

      if (!chore) return;

      const status = approved ? 'approved' : 'rejected';
      const emoji = approved ? '🎉' : '😔';

      return await this.createNotification({
        user_id: childId,
        type: 'approval_request',
        title: `Chore ${status.charAt(0).toUpperCase() + status.slice(1)} ${emoji}`,
        message: `Your chore "${chore.title}" has been ${status}${parentNotes ? '. ' + parentNotes : '.'}`,
        data: {
          choreId,
          approved,
          parentNotes,
          type: 'chore_approval',
        },
        is_read: false,
      });
    } catch (error) {
      console.error('Error creating chore approval notification:', error);
      return null;
    }
  }

  // Create notification when new story is unlocked
  static async notifyStoryUnlock(childId: string, chapterTitle: string) {
    try {
      console.log('📧 Creating story unlock notification for child:', childId);
      
      // Get the parent ID for this child to ensure proper RLS
      const { data: child, error: childError } = await supabase
        .from('children')
        .select('parent_id')
        .eq('id', childId)
        .single();

      if (childError || !child) {
        console.error('📧 Error fetching child parent:', childError);
        return null;
      }

      console.log('📧 Child parent ID:', child.parent_id);

      // Create notification with proper user context
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: childId,
          type: 'story_unlock',
          title: 'New Story Unlocked! 🎉',
          message: `"${chapterTitle}" is ready to read!`,
          data: {
            chapterTitle,
            type: 'story_unlock',
          },
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.error('📧 Error creating story unlock notification:', error);
        return null;
      }

      console.log('📧 Story unlock notification created successfully');
      return data;
    } catch (error) {
      console.error('📧 Error in notifyStoryUnlock:', error);
      return null;
    }
  }

  static async notifyRewardRedemption(childId: string, rewardId: string, parentId: string, status: 'pending' | 'approved') {
    try {
      const [{ data: reward }, { data: child }] = await Promise.all([
        supabase
          .from('rewards')
          .select('title')
          .eq('id', rewardId)
          .single(),
        supabase
          .from('children')
          .select('name')
          .eq('id', childId)
          .single(),
      ]);

      if (!reward || !child) return null;

      const isAutoApproved = status === 'approved';
      const title = isAutoApproved ? 'Reward Redeemed! 🎁' : 'Reward Request Pending';
      const message = isAutoApproved
        ? `${child.name} just redeemed "${reward.title}". Points have been deducted automatically.`
        : `${child.name} wants to redeem "${reward.title}". Approve or decline their request.`;

      return await this.createNotification({
        user_id: parentId,
        type: 'reward_request',
        title,
        message,
        data: {
          rewardId,
          childId,
          status,
          type: 'reward_redemption',
        },
        is_read: false,
      });
    } catch (error) {
      console.error('Error creating reward redemption notification:', error);
      return null;
    }
  }

  static async notifyRewardDecision(childId: string, rewardId: string, approved: boolean, parentNotes?: string) {
    try {
      const [{ data: reward }, { data: child }] = await Promise.all([
        supabase
          .from('rewards')
          .select('title')
          .eq('id', rewardId)
          .single(),
        supabase
          .from('children')
          .select('name')
          .eq('id', childId)
          .single(),
      ]);

      if (!reward || !child) return null;

      const title = approved ? 'Reward Approved! 🎉' : 'Reward Request Denied';
      const message = approved
        ? `Great news! "${reward.title}" has been approved. Enjoy your reward!`
        : `Sorry, "${reward.title}" was not approved this time${parentNotes ? `. ${parentNotes}` : ''}`;

      return await this.createNotification({
        user_id: childId,
        type: 'reward_request',
        title,
        message,
        data: {
          rewardId,
          childId,
          approved,
          parentNotes,
          type: 'reward_decision',
        },
        is_read: false,
      });
    } catch (error) {
      console.error('Error creating reward decision notification:', error);
      return null;
    }
  }
}
