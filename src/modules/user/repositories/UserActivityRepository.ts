import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IUserActivityRepository } from './UserActivityRepository.interface';
import { UserActivity, CreateUserActivityDto } from '../models/UserActivity';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class UserActivityRepository
  extends BasePrismaRepository<UserActivity, string>
  implements IUserActivityRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'userActivity');
  }

  async createActivity(data: CreateUserActivityDto): Promise<UserActivity> {
    try {
      const activity = await this.prisma.userActivity.create({
        data,
      });

      return activity as UserActivity;
    } catch (error) {
      this.logger.error(`Error creating user activity: ${error}`);
      throw AppError.internal('Failed to create user activity', 'DATABASE_ERROR');
    }
  }

  async getUserActivities(
    userId: string,
    activityTypes?: string[],
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<UserActivity>> {
    try {
      const skip = (page - 1) * limit;

      const where: any = { userId };
      if (activityTypes && activityTypes.length > 0) {
        where.activityType = { in: activityTypes };
      }

      // Get total count
      const total = await this.prisma.userActivity.count({ where });

      // Get activities
      const activities = await this.prisma.userActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      return {
        data: activities as UserActivity[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting user activities: ${error}`);
      throw AppError.internal('Failed to get user activities', 'DATABASE_ERROR');
    }
  }

  async getActivityStats(userId: string, days: number = 30): Promise<Record<string, number>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const activities = await this.prisma.userActivity.groupBy({
        by: ['activityType'],
        where: {
          userId,
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          activityType: true,
        },
      });

      const stats: Record<string, number> = {};
      activities.forEach((activity) => {
        stats[activity.activityType] = activity._count.activityType;
      });

      return stats;
    } catch (error) {
      this.logger.error(`Error getting activity stats: ${error}`);
      throw AppError.internal('Failed to get activity stats', 'DATABASE_ERROR');
    }
  }

  async deleteOldActivities(days: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await this.prisma.userActivity.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      return result.count;
    } catch (error) {
      this.logger.error(`Error deleting old activities: ${error}`);
      throw AppError.internal('Failed to delete old activities', 'DATABASE_ERROR');
    }
  }
}
