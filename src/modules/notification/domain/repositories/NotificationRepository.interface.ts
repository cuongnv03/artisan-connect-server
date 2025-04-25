import { BaseRepository } from '../../../../shared/interfaces/BaseRepository';
import {
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationQueryOptions,
  NotificationPaginationResult,
} from '../entities/Notification';

export interface INotificationRepository extends BaseRepository<Notification, string> {
  /**
   * Create a notification
   */
  createNotification(data: CreateNotificationDto): Promise<Notification>;

  /**
   * Update a notification
   */
  updateNotification(id: string, data: UpdateNotificationDto): Promise<Notification>;

  /**
   * Mark notification as read
   */
  markAsRead(id: string): Promise<Notification>;

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: string): Promise<number>;

  /**
   * Get user notifications
   */
  getUserNotifications(
    userId: string,
    options?: NotificationQueryOptions,
  ): Promise<NotificationPaginationResult>;

  /**
   * Get unread notification count
   */
  getUnreadCount(userId: string): Promise<number>;

  /**
   * Delete a notification
   */
  deleteNotification(id: string): Promise<boolean>;

  /**
   * Delete notifications by criteria
   */
  deleteNotifications(criteria: {
    userId?: string;
    olderThan?: Date;
    type?: string;
  }): Promise<number>;
}
