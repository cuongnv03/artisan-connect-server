import { IAnalyticsService } from './AnalyticsService.interface';
import { IAnalyticsRepository } from '../repositories/AnalyticsRepository.interface';
import {
  UserAnalyticsDto,
  ArtisanBusinessAnalyticsDto,
  PlatformAnalyticsDto,
  AnalyticsTimeRange,
} from '../models/AnalyticsDto';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export class AnalyticsService implements IAnalyticsService {
  private analyticsRepository: IAnalyticsRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.analyticsRepository = container.resolve<IAnalyticsRepository>('analyticsRepository');
  }

  async getUserAnalytics(userId: string): Promise<UserAnalyticsDto> {
    try {
      return await this.analyticsRepository.getUserAnalytics(userId);
    } catch (error) {
      this.logger.error(`Error getting user analytics: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get user analytics');
    }
  }

  async getArtisanDashboard(
    artisanId: string,
    period: string,
  ): Promise<ArtisanBusinessAnalyticsDto> {
    try {
      const timeRange = this.parseTimeRange(period);
      return await this.analyticsRepository.getArtisanBusinessAnalytics(artisanId, timeRange);
    } catch (error) {
      this.logger.error(`Error getting artisan dashboard: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get artisan dashboard');
    }
  }

  async getPlatformDashboard(period: string): Promise<PlatformAnalyticsDto> {
    try {
      const timeRange = this.parseTimeRange(period);
      return await this.analyticsRepository.getPlatformAnalytics(timeRange);
    } catch (error) {
      this.logger.error(`Error getting platform dashboard: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get platform dashboard');
    }
  }

  parseTimeRange(period: string): AnalyticsTimeRange {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        return { startDate, endDate, period: 'day' };

      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        return { startDate, endDate, period: 'day' };

      case '3m':
        startDate.setMonth(endDate.getMonth() - 3);
        return { startDate, endDate, period: 'week' };

      case '6m':
        startDate.setMonth(endDate.getMonth() - 6);
        return { startDate, endDate, period: 'month' };

      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        return { startDate, endDate, period: 'month' };

      default:
        startDate.setDate(endDate.getDate() - 30);
        return { startDate, endDate, period: 'day' };
    }
  }
}
