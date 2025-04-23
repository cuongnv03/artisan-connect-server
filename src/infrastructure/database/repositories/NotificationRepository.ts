import {
  PrismaClient,
  Notification as PrismaNotification,
  Prisma,
  NotificationType,
} from '@prisma/client';
import { BasePrismaRepository } from './BasePrismaRepository';
import { INotificationRepository } from '../../../domain/notification/repositories/NotificationRepository.interface';
import {
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationQueryOptions,
  NotificationPaginationResult,
} from '../../../domain/notification/entities/Notification';
import { AppError } from '../../../shared/errors/AppError';
import { Logger } from '../../../shared/utils/Logger';

export class NotificationRepository
  extends BasePrismaRepository<Notification, string>
  implements INotificationRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'notification');
  }

  /**
   * Create a notification
   */
  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type as NotificationType,
          title: data.title,
          content: data.content,
          isRead: false,
          data: data.data as any,
          relatedUserId: data.relatedUserId,
          relatedEntityId: data.relatedEntityId,
          relatedEntityType: data.relatedEntityType,
        },
      });

      return notification as Notification;
    } catch (error) {
      this.logger.error(`Error creating notification: ${error}`);
      throw new AppError('Failed to create notification', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Update a notification
   */
  async updateNotification(id: string, data: UpdateNotificationDto): Promise<Notification> {
    try {
      const notification = await this.prisma.notification.update({
        where: { id },
        data: {
          isRead: data.isRead,
          readAt: data.isRead ? new Date() : undefined,
        },
      });

      return notification as Notification;
    } catch (error) {
      this.logger.error(`Error updating notification: ${error}`);
      throw new AppError('Failed to update notification', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    try {
      const notification = await this.prisma.notification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return notification as Notification;
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error}`);
      throw new AppError('Failed to mark notification as read', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      this.logger.error(`Error marking all notifications as read: ${error}`);
      throw new AppError('Failed to mark all notifications as read', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options?: NotificationQueryOptions,
  ): Promise<NotificationPaginationResult> {
    try {
      const { unreadOnly, type, page = 1, limit = 10 } = options || {};

      // Build where clause
      const where: Prisma.NotificationWhereInput = {
        userId,
      };

      if (unreadOnly) {
        where.isRead = false;
      }

      if (type) {
        if (Array.isArray(type)) {
          where.type = { in: type as NotificationType[] };
        } else {
          where.type = type as NotificationType;
        }
      }

      // Count unread notifications
      const unreadCount = await this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      // Count total notifications matching query
      const total = await this.prisma.notification.count({ where });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Get notifications
      const notifications = await this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: notifications as Notification[],
        meta: {
          total,
          page,
          limit,
          totalPages,
          unreadCount,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting user notifications: ${error}`);
      throw new AppError('Failed to get user notifications', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });
    } catch (error) {
      this.logger.error(`Error getting unread notification count: ${error}`);
      throw new AppError('Failed to get unread notification count', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<boolean> {
    try {
      await this.prisma.notification.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      this.logger.error(`Error deleting notification: ${error}`);
      throw new AppError('Failed to delete notification', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Delete notifications by criteria
   */
  async deleteNotifications(criteria: {
    userId?: string;
    olderThan?: Date;
    type?: string;
  }): Promise<number> {
    try {
      const where: Prisma.NotificationWhereInput = {};

      if (criteria.userId) {
        where.userId = criteria.userId;
      }

      if (criteria.olderThan) {
        where.createdAt = { lt: criteria.olderThan };
      }

      if (criteria.type) {
        where.type = criteria.type as NotificationType;
      }

      const result = await this.prisma.notification.deleteMany({ where });
      return result.count;
    } catch (error) {
      this.logger.error(`Error deleting notifications: ${error}`);
      throw new AppError('Failed to delete notifications', 500, 'DATABASE_ERROR');
    }
  }
}
