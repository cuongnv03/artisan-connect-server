import {
  UserAnalyticsDto,
  ArtisanBusinessAnalyticsDto,
  PlatformAnalyticsDto,
  AnalyticsTimeRange,
} from '../models/AnalyticsDto';

export interface IAnalyticsService {
  // User analytics
  getUserAnalytics(userId: string): Promise<UserAnalyticsDto>;

  // Artisan analytics
  getArtisanDashboard(artisanId: string, period: string): Promise<ArtisanBusinessAnalyticsDto>;

  // Admin analytics
  getPlatformDashboard(period: string): Promise<PlatformAnalyticsDto>;

  // Utility methods
  parseTimeRange(period: string): AnalyticsTimeRange;
}
