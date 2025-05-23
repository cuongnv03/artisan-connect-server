import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { PostAnalytics, PostInsightsDto, TrendingPostData } from '../models/PostAnalytics';

export interface IPostAnalyticsRepository extends BaseRepository<PostAnalytics, string> {
  /**
   * Find analytics by post ID
   */
  findByPostId(postId: string): Promise<PostAnalytics | null>;

  /**
   * Create or update analytics for a post
   */
  upsertAnalytics(postId: string, data: Partial<PostAnalytics>): Promise<PostAnalytics>;

  /**
   * Track a view event
   */
  trackView(postId: string, isUnique: boolean): Promise<void>;

  /**
   * Track a conversion event
   */
  trackConversion(postId: string): Promise<void>;

  /**
   * Update average read time
   */
  updateAvgReadTime(postId: string, timeSpent: number): Promise<void>;

  /**
   * Get post insights with trend data
   */
  getPostInsights(postId: string, days?: number): Promise<PostInsightsDto>;

  /**
   * Get trending posts
   */
  getTrendingPosts(limit?: number, days?: number): Promise<TrendingPostData[]>;

  /**
   * Get analytics for multiple posts
   */
  getPostsAnalytics(postIds: string[]): Promise<PostAnalytics[]>;

  /**
   * Get user's posts analytics summary
   */
  getUserPostsAnalyticsSummary(userId: string): Promise<{
    totalPosts: number;
    totalViews: number;
    totalUniqueViewers: number;
    totalConversions: number;
    avgReadTime: number | null;
  }>;

  /**
   * Clean up old analytics data
   */
  cleanupOldData(daysToKeep: number): Promise<number>;
}
