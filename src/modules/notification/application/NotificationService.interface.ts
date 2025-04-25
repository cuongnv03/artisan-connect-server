import {
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationQueryOptions,
  NotificationPaginationResult,
  NotificationType,
} from '../domain/entities/Notification';
import {
  NotificationPreference,
  UpdatePreferencesDto,
} from '../domain/entities/NotificationPreference';

export interface INotificationService {
  /**
   * Create a notification
   */
  createNotification(data: CreateNotificationDto): Promise<Notification>;

  /**
   * Mark notification as read
   */
  markAsRead(id: string, userId: string): Promise<Notification>;

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: string): Promise<number>;

  /**
   * Get user notifications with pagination
   */
  getUserNotifications(
    userId: string,
    options?: NotificationQueryOptions,
  ): Promise<NotificationPaginationResult>;

  /**
   * Get unread notification count for a user
   */
  getUnreadCount(userId: string): Promise<number>;

  /**
   * Delete a notification
   */
  deleteNotification(id: string, userId: string): Promise<boolean>;

  /**
   * Clean up old notifications
   */
  cleanupOldNotifications(days?: number): Promise<number>;

  /**
   * Send notification for system events
   */
  sendSystemNotification(
    userId: string,
    title: string,
    content: string,
    data?: any,
  ): Promise<Notification>;

  /**
   * Get notification types that a user can subscribe to
   */
  getNotificationTypes(): NotificationType[];

  /**
   * Get user notification preferences
   */
  getUserPreferences(userId: string): Promise<NotificationPreference[]>;

  /**
   * Update user notification preferences
   */
  updateUserPreferences(
    userId: string,
    data: UpdatePreferencesDto,
  ): Promise<NotificationPreference[]>;

  /**
   * Initialize default preferences for a new user
   */
  initializeUserPreferences(userId: string): Promise<NotificationPreference[]>;

  /**
   * Check if user has enabled notifications for a specific type
   */
  isNotificationEnabled(userId: string, type: NotificationType): Promise<boolean>;
}
