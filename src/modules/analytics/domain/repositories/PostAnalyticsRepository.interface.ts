import { BaseRepository } from '../../../../shared/interfaces/BaseRepository';
import { PostAnalytics, PostInsightsDto } from '../entities/PostAnalytics';

export interface IPostAnalyticsRepository extends BaseRepository<PostAnalytics, string> {
  /**
   * Find analytics by post ID
   */
  findByPostId(postId: string): Promise<PostAnalytics | null>;

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
  getTrendingPosts(limit?: number): Promise<string[]>;
}
