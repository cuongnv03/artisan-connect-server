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
  private sessionViews: Map<string, Set<string>> = new Map(); // sessionId -> Set of viewed postIds
  private readonly SESSION_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
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
      const { postId, userId, sessionId, timeSpent, referrer, userAgent, ipAddress } = data;

      // Validate post exists
      const post = await this.postRepository.findById(postId);
      if (!post) {
        this.logger.warn(`Attempted to track view for non-existent post: ${postId}`);
        return;
      }

      // Check if this is a unique view for this session
      let sessionViewedPosts = this.sessionViews.get(sessionId);
      if (!sessionViewedPosts) {
        sessionViewedPosts = new Set();
        this.sessionViews.set(sessionId, sessionViewedPosts);
      }

      const isUniqueView = !sessionViewedPosts.has(postId);
      if (isUniqueView) {
        sessionViewedPosts.add(postId);
        this.logger.debug(`Unique view for post ${postId} from session ${sessionId}`);
      } else {
        this.logger.debug(`Repeat view for post ${postId} from session ${sessionId}`);
      }

      // Track the view
      await this.postAnalyticsRepository.trackView(postId, isUniqueView);

      // If time spent is provided, update average read time
      if (timeSpent && timeSpent > 0) {
        await this.postAnalyticsRepository.updateAvgReadTime(postId, timeSpent);
        this.logger.debug(`Updated read time for post ${postId}: ${timeSpent}s`);
      }

      // Log additional details
      const logData = {
        postId,
        userId: userId || 'anonymous',
        sessionId,
        isUnique: isUniqueView,
        timeSpent: timeSpent || 'unknown',
        referrer: referrer || 'direct',
        userAgent: userAgent ? userAgent.substring(0, 50) : 'unknown',
        ipAddress: ipAddress || 'unknown',
      };

      this.logger.info(`View tracked: ${JSON.stringify(logData)}`);

      // Periodically clean up old sessions
      this.cleanupSessions();
    } catch (error) {
      this.logger.error(`Error tracking view event: ${error}`);
      // Non-critical operation, just log the error
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
  private cleanupSessions(): void {
    const now = Date.now();

    // Only cleanup if enough time has passed
    if (now - this.lastCleanup < this.SESSION_CLEANUP_INTERVAL) {
      return;
    }

    try {
      // Simple cleanup - clear all sessions if we have too many
      // In production, you'd use Redis with TTL
      if (this.sessionViews.size > 10000) {
        this.logger.info(
          `Cleaning up session views cache, current size: ${this.sessionViews.size}`,
        );
        this.sessionViews.clear();
        this.logger.info('Session views cache cleared');
      }

      this.lastCleanup = now;
    } catch (error) {
      this.logger.error(`Error cleaning up sessions: ${error}`);
    }
  }
}
