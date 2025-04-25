import { IPostAnalyticsService } from './PostAnalyticsService.interface';
import {
  PostAnalytics,
  PostInsightsDto,
  TrackViewEventDto,
} from '../domain/entities/PostAnalytics';
import { IPostAnalyticsRepository } from '../domain/repositories/PostAnalyticsRepository.interface';
import { IPostRepository } from '../../content/domain/repositories/PostRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export class PostAnalyticsService implements IPostAnalyticsService {
  private postAnalyticsRepository: IPostAnalyticsRepository;
  private postRepository: IPostRepository;
  private logger = Logger.getInstance();
  private sessionViews: Map<string, Set<string>> = new Map(); // sessionId -> Set of viewed postIds

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
      const { postId, userId, sessionId, timeSpent } = data;

      // Check if this is a unique view for this session
      let sessionViewedPosts = this.sessionViews.get(sessionId);
      if (!sessionViewedPosts) {
        sessionViewedPosts = new Set();
        this.sessionViews.set(sessionId, sessionViewedPosts);
      }

      const isUniqueView = !sessionViewedPosts.has(postId);
      if (isUniqueView) {
        sessionViewedPosts.add(postId);
      }

      // Track the view
      await this.postAnalyticsRepository.trackView(postId, isUniqueView);

      // If time spent is provided, update average read time
      if (timeSpent && timeSpent > 0) {
        await this.postAnalyticsRepository.updateAvgReadTime(postId, timeSpent);
      }

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
      await this.postAnalyticsRepository.trackConversion(postId);
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
  async getTrendingPosts(limit: number = 10): Promise<string[]> {
    try {
      return await this.postAnalyticsRepository.getTrendingPosts(limit);
    } catch (error) {
      this.logger.error(`Error getting trending posts: ${error}`);
      return [];
    }
  }

  /**
   * Clean up old sessions to prevent memory leaks
   */
  private cleanupSessions(): void {
    // Remove sessions older than 24 hours
    // In a real app, this would use Redis or another solution for shared session state
    try {
      const now = Date.now();
      const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      // This is a simplified example - in production, you'd use proper session management
      if (this.sessionViews.size > 1000) {
        // Only clean up if we have a lot of sessions
        this.sessionViews.clear();
      }
    } catch (error) {
      this.logger.error(`Error cleaning up sessions: ${error}`);
    }
  }
}
