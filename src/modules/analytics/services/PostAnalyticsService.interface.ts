import {
  PostAnalytics,
  PostInsightsDto,
  TrackViewEventDto,
  AnalyticsSummaryDto,
  TrendingPostData,
} from '../models/PostAnalytics';

export interface IPostAnalyticsService {
  /**
   * Get analytics for a post
   */
  getPostAnalytics(postId: string): Promise<PostAnalytics | null>;

  /**
   * Track a view event
   */
  trackViewEvent(data: TrackViewEventDto): Promise<void>;

  /**
   * Track a conversion event
   */
  trackConversionEvent(postId: string): Promise<void>;

  /**
   * Get post insights
   */
  getPostInsights(postId: string, days?: number): Promise<PostInsightsDto>;

  /**
   * Get trending posts
   */
  getTrendingPosts(limit?: number, days?: number): Promise<TrendingPostData[]>;

  /**
   * Get user's analytics summary
   */
  getUserAnalyticsSummary(userId: string): Promise<AnalyticsSummaryDto>;

  /**
   * Bulk get analytics for posts
   */
  getBulkPostAnalytics(postIds: string[]): Promise<PostAnalytics[]>;

  /**
   * Initialize analytics for a new post
   */
  initializePostAnalytics(postId: string): Promise<PostAnalytics>;

  /**
   * Clean up old analytics data
   */
  cleanupOldData(daysToKeep?: number): Promise<number>;
}
