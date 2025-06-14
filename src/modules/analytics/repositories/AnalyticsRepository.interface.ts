import {
  UserAnalyticsDto,
  ArtisanBusinessAnalyticsDto,
  PlatformAnalyticsDto,
  AnalyticsTimeRange,
} from '../models/AnalyticsDto';

export interface IAnalyticsRepository {
  // User analytics
  getUserAnalytics(userId: string): Promise<UserAnalyticsDto>;

  // Artisan business analytics
  getArtisanBusinessAnalytics(
    artisanId: string,
    timeRange: AnalyticsTimeRange,
  ): Promise<ArtisanBusinessAnalyticsDto>;

  // Platform analytics (admin only)
  getPlatformAnalytics(timeRange: AnalyticsTimeRange): Promise<PlatformAnalyticsDto>;

  // Specific metrics
  getSalesTrends(
    artisanId: string,
    timeRange: AnalyticsTimeRange,
  ): Promise<Array<{ period: string; revenue: number; orders: number; customers: number }>>;
  getFollowerGrowth(
    artisanId: string,
    timeRange: AnalyticsTimeRange,
  ): Promise<Array<{ period: string; count: number }>>;
  getTopProducts(
    artisanId: string,
    limit: number,
  ): Promise<
    Array<{ id: string; name: string; revenue: number; orderCount: number; averageRating: number }>
  >;
  getCustomerInsights(
    artisanId: string,
  ): Promise<{
    totalCustomers: number;
    repeatCustomers: number;
    newCustomers: number;
    customerRetentionRate: number;
  }>;
}
