import { INotificationService } from './NotificationService.interface';
import {
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationQueryOptions,
  NotificationPaginationResult,
  NotificationType,
} from '../../../domain/notification/entities/Notification';
import {
  NotificationPreference,
  UpdatePreferencesDto,
} from '../../../domain/notification/entities/NotificationPreference';
import { INotificationRepository } from '../../../domain/notification/repositories/NotificationRepository.interface';
import { INotificationPreferenceRepository } from '../../../domain/notification/repositories/NotificationPreferenceRepository.interface';
import { IUserRepository } from '../../../domain/user/repositories/UserRepository.interface';
import { AppError } from '../../../shared/errors/AppError';
import { Logger } from '../../../shared/utils/Logger';
import container from '../../../di/container';

export class NotificationService implements INotificationService {
  private notificationRepository: INotificationRepository;
  private notificationPreferenceRepository: INotificationPreferenceRepository;
  private userRepository: IUserRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.notificationRepository =
      container.resolve<INotificationRepository>('notificationRepository');
    this.notificationPreferenceRepository = container.resolve<INotificationPreferenceRepository>(
      'notificationPreferenceRepository',
    );
    this.userRepository = container.resolve<IUserRepository>('userRepository');
  }

  /**
   * Create a notification
   */
  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    try {
      // Validate user exists
      const user = await this.userRepository.findById(data.userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Check if user has enabled this notification type
      const isEnabled = await this.isNotificationEnabled(data.userId, data.type);
      if (!isEnabled) {
        this.logger.info(
          `Skipping notification for user ${data.userId} (type: ${data.type}) - disabled by user preferences`,
        );
        // Return dummy notification to satisfy interface
        return {
          id: 'skipped',
          userId: data.userId,
          type: data.type,
          title: data.title,
          content: data.content,
          isRead: true,
          data: data.data,
          relatedUserId: data.relatedUserId,
          relatedEntityId: data.relatedEntityId,
          relatedEntityType: data.relatedEntityType,
          createdAt: new Date(),
        };
      }

      return await this.notificationRepository.createNotification(data);
    } catch (error) {
      this.logger.error(`Error creating notification: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create notification', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    try {
      // Verify the notification exists and belongs to user
      const notification = await this.notificationRepository.findById(id);
      if (!notification) {
        throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
      }

      if (notification.userId !== userId) {
        throw new AppError('You can only mark your own notifications as read', 403, 'FORBIDDEN');
      }

      return await this.notificationRepository.markAsRead(id);
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to mark notification as read', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      return await this.notificationRepository.markAllAsRead(userId);
    } catch (error) {
      this.logger.error(`Error marking all notifications as read: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to mark all notifications as read', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    options?: NotificationQueryOptions,
  ): Promise<NotificationPaginationResult> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      return await this.notificationRepository.getUserNotifications(userId, options);
    } catch (error) {
      this.logger.error(`Error getting user notifications: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get user notifications', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      return await this.notificationRepository.getUnreadCount(userId);
    } catch (error) {
      this.logger.error(`Error getting unread notification count: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get unread notification count', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string, userId: string): Promise<boolean> {
    try {
      // Verify the notification exists and belongs to user
      const notification = await this.notificationRepository.findById(id);
      if (!notification) {
        throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
      }

      if (notification.userId !== userId) {
        throw new AppError('You can only delete your own notifications', 403, 'FORBIDDEN');
      }

      return await this.notificationRepository.deleteNotification(id);
    } catch (error) {
      this.logger.error(`Error deleting notification: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete notification', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Clean up old notifications
   */
  async cleanupOldNotifications(days: number = 30): Promise<number> {
    try {
      const olderThan = new Date();
      olderThan.setDate(olderThan.getDate() - days);

      // Delete notifications older than specified days
      return await this.notificationRepository.deleteNotifications({
        olderThan,
      });
    } catch (error) {
      this.logger.error(`Error cleaning up old notifications: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to clean up old notifications', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Send notification for system events
   */
  async sendSystemNotification(
    userId: string,
    title: string,
    content: string,
    data?: any,
  ): Promise<Notification> {
    try {
      return await this.createNotification({
        userId,
        type: NotificationType.SYSTEM,
        title,
        content,
        data,
      });
    } catch (error) {
      this.logger.error(`Error sending system notification: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send system notification', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get notification types that a user can subscribe to
   */
  getNotificationTypes(): NotificationType[] {
    return Object.values(NotificationType);
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      return await this.notificationPreferenceRepository.getUserPreferences(userId);
    } catch (error) {
      this.logger.error(`Error getting user preferences: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get user preferences', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    data: UpdatePreferencesDto,
  ): Promise<NotificationPreference[]> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Update each preference
      const updatedPreferences = await Promise.all(
        data.preferences.map(async (pref) => {
          return this.notificationPreferenceRepository.updateOrCreatePreference(
            userId,
            pref.type,
            pref.enabled,
          );
        }),
      );

      return updatedPreferences;
    } catch (error) {
      this.logger.error(`Error updating user preferences: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update user preferences', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Initialize default preferences for a new user
   */
  async initializeUserPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      return await this.notificationPreferenceRepository.initializeDefaultPreferences(userId);
    } catch (error) {
      this.logger.error(`Error initializing user preferences: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to initialize user preferences', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Check if user has enabled notifications for a specific type
   */
  async isNotificationEnabled(userId: string, type: NotificationType): Promise<boolean> {
    try {
      const preference = await this.notificationPreferenceRepository.getUserPreference(
        userId,
        type,
      );

      // If no preference is set, default to enabled
      if (!preference) {
        return true;
      }

      return preference.enabled;
    } catch (error) {
      this.logger.error(`Error checking if notification is enabled: ${error}`);
      // Default to enabled in case of error
      return true;
    }
  }
}
