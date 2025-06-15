import { PrismaClient } from '@prisma/client';
import { INotificationRepository } from './NotificationRepository.interface';
import {
  Notification,
  NotificationWithSender,
  CreateNotificationDto,
  NotificationQueryOptions,
} from '../models/Notification';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { PaginationUtils } from '../../../shared/utils/PaginationUtils';
import { AppError } from '../../../core/errors/AppError';

export class NotificationRepository implements INotificationRepository {
  constructor(private prisma: PrismaClient) {}

  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    try {
      return await this.prisma.notification.create({
        data,
      });
    } catch (error) {
      throw new AppError('Failed to create notification', 500, 'NOTIFICATION_CREATE_FAILED');
    }
  }

  async findById(id: string): Promise<NotificationWithSender | null> {
    try {
      return await this.prisma.notification.findUnique({
        where: { id },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });
    } catch (error) {
      throw new AppError('Failed to find notification', 500, 'NOTIFICATION_FIND_FAILED');
    }
  }

  async getUserNotifications(
    userId: string,
    options: NotificationQueryOptions = {},
  ): Promise<PaginatedResult<NotificationWithSender>> {
    try {
      const { page = 1, limit = 20, isRead, types, dateFrom, dateTo } = options;
      const skip = PaginationUtils.calculateSkip(page, limit);

      const where: any = {
        recipientId: userId,
      };

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      if (types && types.length > 0) {
        where.type = { in: types };
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.notification.count({ where }),
      ]);

      return PaginationUtils.createPaginatedResult(notifications, total, page, limit);
    } catch (error) {
      throw new AppError('Failed to get user notifications', 500, 'NOTIFICATION_GET_FAILED');
    }
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          id,
          recipientId: userId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return result.count > 0;
    } catch (error) {
      throw new AppError('Failed to mark notification as read', 500, 'NOTIFICATION_READ_FAILED');
    }
  }

  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          recipientId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      throw new AppError(
        'Failed to mark all notifications as read',
        500,
        'NOTIFICATION_READ_ALL_FAILED',
      );
    }
  }

  async deleteNotification(id: string, userId: string): Promise<boolean> {
    try {
      const result = await this.prisma.notification.deleteMany({
        where: {
          id,
          recipientId: userId,
        },
      });

      return result.count > 0;
    } catch (error) {
      throw new AppError('Failed to delete notification', 500, 'NOTIFICATION_DELETE_FAILED');
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.prisma.notification.count({
        where: {
          recipientId: userId,
          isRead: false,
        },
      });
    } catch (error) {
      throw new AppError('Failed to get unread count', 500, 'NOTIFICATION_COUNT_FAILED');
    }
  }

  async cleanupOldNotifications(days: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await this.prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          isRead: true,
        },
      });

      return result.count;
    } catch (error) {
      throw new AppError('Failed to cleanup notifications', 500, 'NOTIFICATION_CLEANUP_FAILED');
    }
  }
}
