import { IPostAnalyticsService } from './PostAnalyticsService.interface';
import {
  PostAnalytics,
  PostInsightsDto,
  TrackViewEventDto,
  AnalyticsSummaryDto,
  TrendingPostData,
} from '../models/PostAnalytics';
import { IPostAnalyticsRepository } from '../repositories/PostAnalyticsRepository.interface';
import { IPostRepository } from '../../post/repositories/PostRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export class PostAnalyticsService implements IPostAnalyticsService {
  private postAnalyticsRepository: IPostAnalyticsRepository;
  private postRepository: IPostRepository;
  private logger = Logger.getInstance();
  private sessionViews: Map<string, { views: Set<string>; lastAccess: number }> = new Map();
  private readonly SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  private readonly SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
  private lastCleanup = Date.now();

  constructor() {
    this.postAnalyticsRepository =
      container.resolve<IPostAnalyticsRepository>('postAnalyticsRepository');
    this.postRepository = container.resolve<IPostRepository>('postRepository');
  }

  /**
   * Get analytics for a post
   */
  async getPostAnalytics(postId: string): Promise<PostAnalytics | null> {
    try {
      // Validate post exists
      const post = await this.postRepository.findById(postId);
      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      this.logger.debug(`Fetching analytics for post ${postId}`);
      return await this.postAnalyticsRepository.findByPostId(postId);
    } catch (error) {
      this.logger.error(`Error getting post analytics: ${error}`);
      if (error instanceof AppError) throw error;
      return null;
    }
  }

  /**
   * Track a view event
   */
  async trackViewEvent(data: TrackViewEventDto): Promise<void> {
    try {
      const { postId, sessionId, timeSpent } = data;
      const now = Date.now();

      // Get or create session data
      if (!this.sessionViews.has(sessionId)) {
        this.sessionViews.set(sessionId, {
          views: new Set(),
          lastAccess: now,
        });
      }

      const sessionData = this.sessionViews.get(sessionId)!;
      sessionData.lastAccess = now;

      const isUniqueView = !sessionData.views.has(postId);
      if (isUniqueView) {
        sessionData.views.add(postId);
      }

      // Track the view
      await this.postAnalyticsRepository.trackView(postId, isUniqueView);

      // Update read time
      if (timeSpent && timeSpent > 0) {
        await this.postAnalyticsRepository.updateAvgReadTime(postId, timeSpent);
      }

      // Periodic cleanup
      this.cleanupExpiredSessions();
    } catch (error) {
      this.logger.error(`Error tracking view event: ${error}`);
    }
  }

  /**
   * Track a conversion event
   */
  async trackConversionEvent(postId: string): Promise<void> {
    try {
      // Validate post exists
      const post = await this.postRepository.findById(postId);
      if (!post) {
        this.logger.warn(`Attempted to track conversion for non-existent post: ${postId}`);
        return;
      }

      await this.postAnalyticsRepository.trackConversion(postId);
      this.logger.info(`Conversion tracked for post ${postId}`);
    } catch (error) {
      this.logger.error(`Error tracking conversion event: ${error}`);
      // Non-critical operation, just log the error
    }
  }

  /**
   * Get post insights
   */
  async getPostInsights(postId: string, days: number = 30): Promise<PostInsightsDto> {
    try {
      // Validate post exists
      const post = await this.postRepository.findById(postId);
      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      this.logger.info(`Fetching insights for post ${postId} over ${days} days`);
      return await this.postAnalyticsRepository.getPostInsights(postId, days);
    } catch (error) {
      this.logger.error(`Error getting post insights: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get post insights', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get trending posts
   */
  async getTrendingPosts(limit: number = 10, days: number = 7): Promise<TrendingPostData[]> {
    try {
      this.logger.info(`Fetching top ${limit} trending posts over ${days} days`);
      return await this.postAnalyticsRepository.getTrendingPosts(limit, days);
    } catch (error) {
      this.logger.error(`Error getting trending posts: ${error}`);
      return [];
    }
  }

  /**
   * Get user's analytics summary
   */
  async getUserAnalyticsSummary(userId: string): Promise<AnalyticsSummaryDto> {
    try {
      this.logger.info(`Fetching analytics summary for user ${userId}`);

      // Get basic summary from repository
      const summary = await this.postAnalyticsRepository.getUserPostsAnalyticsSummary(userId);

      // Get user's posts
      const userPosts = await this.postRepository.findAll({
        where: {
          userId,
          status: 'PUBLISHED',
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Get analytics for each post and find top performing ones
      const postsWithAnalytics = await Promise.all(
        userPosts.map(async (post) => {
          const analytics = await this.postAnalyticsRepository.findByPostId(post.id);
          return {
            post,
            analytics,
          };
        }),
      );

      // Filter posts that have analytics and sort by view count
      const topPerformingPosts = postsWithAnalytics
        .filter(({ analytics }) => analytics !== null)
        .sort((a, b) => (b.analytics!.viewCount || 0) - (a.analytics!.viewCount || 0))
        .slice(0, 5) // Top 5 posts
        .map(({ post, analytics }) => ({
          postId: post.id,
          title: post.title,
          viewCount: analytics!.viewCount,
          conversionCount: analytics!.conversionCount,
        }));

      return {
        ...summary,
        topPerformingPosts,
      };
    } catch (error) {
      this.logger.error(`Error getting user analytics summary: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get analytics summary', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Bulk get analytics for posts
   */
  async getBulkPostAnalytics(postIds: string[]): Promise<PostAnalytics[]> {
    try {
      this.logger.debug(`Fetching bulk analytics for ${postIds.length} posts`);
      return await this.postAnalyticsRepository.getPostsAnalytics(postIds);
    } catch (error) {
      this.logger.error(`Error getting bulk post analytics: ${error}`);
      return [];
    }
  }

  /**
   * Initialize analytics for a new post
   */
  async initializePostAnalytics(postId: string): Promise<PostAnalytics> {
    try {
      // Validate post exists
      const post = await this.postRepository.findById(postId);
      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      this.logger.info(`Initializing analytics for post ${postId}`);

      return await this.postAnalyticsRepository.upsertAnalytics(postId, {
        viewCount: 0,
        uniqueViewers: 0,
        avgReadTime: null,
        conversionCount: 0,
      });
    } catch (error) {
      this.logger.error(`Error initializing post analytics: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to initialize analytics', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Clean up old analytics data
   */
  async cleanupOldData(daysToKeep: number = 365): Promise<number> {
    try {
      this.logger.info(`Cleaning up analytics data older than ${daysToKeep} days`);
      const deletedCount = await this.postAnalyticsRepository.cleanupOldData(daysToKeep);
      this.logger.info(`Cleaned up ${deletedCount} old analytics records`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Error cleaning up old analytics data: ${error}`);
      return 0;
    }
  }

  /**
   * Clean up old sessions to prevent memory leaks
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();

    // Only cleanup if interval has passed
    if (now - this.lastCleanup < this.SESSION_CLEANUP_INTERVAL) {
      return;
    }

    let cleanedCount = 0;
    const maxSessions = 10000; // Limit memory usage

    // If too many sessions, clean oldest ones
    if (this.sessionViews.size > maxSessions) {
      const sortedSessions = Array.from(this.sessionViews.entries()).sort(
        (a, b) => a[1].lastAccess - b[1].lastAccess,
      );

      const toDelete = sortedSessions.slice(0, this.sessionViews.size - maxSessions);
      toDelete.forEach(([sessionId]) => {
        this.sessionViews.delete(sessionId);
        cleanedCount++;
      });
    }

    // Clean expired sessions
    for (const [sessionId, sessionData] of this.sessionViews.entries()) {
      if (now - sessionData.lastAccess > this.SESSION_MAX_AGE) {
        this.sessionViews.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} expired analytics sessions`);
    }

    this.lastCleanup = now;
  }

  // Public method to force cleanup
  public cleanupSessions(): void {
    this.lastCleanup = 0; // Force cleanup
    this.cleanupExpiredSessions();
  }
}
