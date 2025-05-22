import { IActivityTrackingService } from './ActivityTrackingService.interface';
import { CreateUserActivityDto, UserActivity } from '../models/UserActivity';
import { IUserActivityRepository } from '../repositories/UserActivityRepository.interface';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export class ActivityTrackingService implements IActivityTrackingService {
  private userActivityRepository: IUserActivityRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.userActivityRepository =
      container.resolve<IUserActivityRepository>('userActivityRepository');
  }

  async trackActivity(data: CreateUserActivityDto): Promise<UserActivity> {
    try {
      return await this.userActivityRepository.createActivity(data);
    } catch (error) {
      this.logger.error(`Error tracking activity: ${error}`);
      // Don't throw error for activity tracking to avoid breaking main operations
      throw AppError.internal('Failed to track activity', 'SERVICE_ERROR');
    }
  }

  async getUserActivities(
    userId: string,
    activityTypes?: string[],
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<UserActivity>> {
    try {
      return await this.userActivityRepository.getUserActivities(
        userId,
        activityTypes,
        page,
        limit,
      );
    } catch (error) {
      this.logger.error(`Error getting user activities: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get user activities', 'SERVICE_ERROR');
    }
  }

  async getActivityStats(userId: string, days?: number): Promise<Record<string, number>> {
    try {
      return await this.userActivityRepository.getActivityStats(userId, days);
    } catch (error) {
      this.logger.error(`Error getting activity stats: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get activity stats', 'SERVICE_ERROR');
    }
  }
}
