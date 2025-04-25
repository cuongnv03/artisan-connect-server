import {
  PrismaClient,
  NotificationPreference as PrismaNotificationPreference,
  Prisma,
  NotificationType,
} from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { INotificationPreferenceRepository } from '../domain/repositories/NotificationPreferenceRepository.interface';
import { NotificationPreference } from '../domain/entities/NotificationPreference';
import { NotificationType as DomainNotificationType } from '../domain/entities/Notification';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class NotificationPreferenceRepository
  extends BasePrismaRepository<NotificationPreference, string>
  implements INotificationPreferenceRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'notificationPreference');
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      const preferences = await this.prisma.notificationPreference.findMany({
        where: { userId },
      });

      return preferences as NotificationPreference[];
    } catch (error) {
      this.logger.error(`Error getting user preferences: ${error}`);
      throw new AppError('Failed to get user preferences', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get user preference for specific type
   */
  async getUserPreference(
    userId: string,
    type: DomainNotificationType,
  ): Promise<NotificationPreference | null> {
    try {
      const preference = await this.prisma.notificationPreference.findUnique({
        where: {
          userId_type: {
            userId,
            type: type as NotificationType,
          },
        },
      });

      return preference as NotificationPreference | null;
    } catch (error) {
      this.logger.error(`Error getting user preference: ${error}`);
      throw new AppError('Failed to get user preference', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Update or create user preference
   */
  async updateOrCreatePreference(
    userId: string,
    type: DomainNotificationType,
    enabled: boolean,
  ): Promise<NotificationPreference> {
    try {
      const preference = await this.prisma.notificationPreference.upsert({
        where: {
          userId_type: {
            userId,
            type: type as NotificationType,
          },
        },
        update: {
          enabled,
        },
        create: {
          userId,
          type: type as NotificationType,
          enabled,
        },
      });

      return preference as NotificationPreference;
    } catch (error) {
      this.logger.error(`Error updating user preference: ${error}`);
      throw new AppError('Failed to update user preference', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Initialize default preferences for a new user
   */
  async initializeDefaultPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      // Get all notification types from enum
      const notificationTypes = Object.values(DomainNotificationType);

      // Create default preferences (all enabled by default)
      const preferences = await Promise.all(
        notificationTypes.map(async (type) => {
          return this.updateOrCreatePreference(userId, type, true);
        }),
      );

      return preferences;
    } catch (error) {
      this.logger.error(`Error initializing default preferences: ${error}`);
      throw new AppError('Failed to initialize default preferences', 500, 'DATABASE_ERROR');
    }
  }
}
