import { PostAnalytics, PostInsightsDto, TrackViewEventDto } from '../models/PostAnalytics';

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
  getTrendingPosts(limit?: number): Promise<string[]>;
}
