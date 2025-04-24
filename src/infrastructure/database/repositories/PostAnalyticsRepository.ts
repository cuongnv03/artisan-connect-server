import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from './BasePrismaRepository';
import { IPostAnalyticsRepository } from '../../../domain/analytics/repositories/PostAnalyticsRepository.interface';
import { PostAnalytics, PostInsightsDto } from '../../../domain/analytics/entities/PostAnalytics';
import { AppError } from '../../../shared/errors/AppError';
import { Logger } from '../../../shared/utils/Logger';

export class PostAnalyticsRepository
  extends BasePrismaRepository<PostAnalytics, string>
  implements IPostAnalyticsRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'postAnalytics');
  }

  /**
   * Find analytics by post ID
   */
  async findByPostId(postId: string): Promise<PostAnalytics | null> {
    try {
      const analytics = await this.prisma.postAnalytics.findUnique({
        where: { postId },
      });

      return analytics as PostAnalytics | null;
    } catch (error) {
      this.logger.error(`Error finding analytics by post ID: ${error}`);
      return null;
    }
  }

  /**
   * Track a view event
   */
  async trackView(postId: string, isUnique: boolean): Promise<void> {
    try {
      // Get or create analytics for this post
      const analytics = await this.prisma.postAnalytics.upsert({
        where: { postId },
        update: {
          viewCount: { increment: 1 },
          // Only increment unique viewers if this is a unique view
          uniqueViewers: isUnique ? { increment: 1 } : undefined,
        },
        create: {
          postId,
          viewCount: 1,
          uniqueViewers: isUnique ? 1 : 0,
          conversionCount: 0,
        },
      });

      // Also update view count in the post itself
      await this.prisma.post.update({
        where: { id: postId },
        data: {
          viewCount: { increment: 1 },
        },
      });
    } catch (error) {
      this.logger.error(`Error tracking view: ${error}`);
      // Non-critical operation, just log the error
    }
  }

  /**
   * Track a conversion event
   */
  async trackConversion(postId: string): Promise<void> {
    try {
      // Get or create analytics for this post
      await this.prisma.postAnalytics.upsert({
        where: { postId },
        update: {
          conversionCount: { increment: 1 },
        },
        create: {
          postId,
          viewCount: 0,
          uniqueViewers: 0,
          conversionCount: 1,
        },
      });
    } catch (error) {
      this.logger.error(`Error tracking conversion: ${error}`);
      // Non-critical operation, just log the error
    }
  }

  /**
   * Update average read time
   */
  async updateAvgReadTime(postId: string, timeSpent: number): Promise<void> {
    try {
      // Get current analytics
      const analytics = await this.prisma.postAnalytics.findUnique({
        where: { postId },
      });

      if (!analytics) {
        // Create new analytics if none exists
        await this.prisma.postAnalytics.create({
          data: {
            postId,
            viewCount: 1,
            uniqueViewers: 1,
            avgReadTime: timeSpent,
            conversionCount: 0,
          },
        });
        return;
      }

      // Calculate new average read time
      const currentAvg = analytics.avgReadTime || 0;
      const newAvg =
        currentAvg > 0
          ? (currentAvg * analytics.viewCount + timeSpent) / (analytics.viewCount + 1)
          : timeSpent;

      // Update analytics
      await this.prisma.postAnalytics.update({
        where: { postId },
        data: {
          avgReadTime: newAvg,
        },
      });
    } catch (error) {
      this.logger.error(`Error updating average read time: ${error}`);
      // Non-critical operation, just log the error
    }
  }

  /**
   * Get post insights with trend data
   */
  async getPostInsights(postId: string, days: number = 30): Promise<PostInsightsDto> {
    try {
      // Get basic analytics
      const analytics = await this.prisma.postAnalytics.findUnique({
        where: { postId },
      });

      if (!analytics) {
        throw new AppError('Analytics not found for this post', 404, 'ANALYTICS_NOT_FOUND');
      }

      // Get post for interaction data
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: {
          _count: {
            select: {
              likes: true,
              comments: true,
              savedBy: true,
            },
          },
        },
      });

      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      // Get user activity data for trend graph (mocked data for now)
      // In a real implementation, this would come from a time-series database or aggregated logs
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trendData = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);

        // Generate random view count between 0 and the total view count
        const randomViews = Math.floor(Math.random() * ((analytics.viewCount / days) * 2));

        trendData.push({
          date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
          views: randomViews,
        });
      }

      return {
        analytics: analytics as PostAnalytics,
        trendData,
        interactionData: {
          likes: post._count.likes,
          comments: post._count.comments,
          shares: 0, // Not implemented yet
          saves: post._count.savedBy,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting post insights: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get post insights', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get trending posts
   */
  async getTrendingPosts(limit: number = 10): Promise<string[]> {
    try {
      // Get posts with the most views in the last 7 days
      // This is a simplified implementation - in a real app, this would be more sophisticated
      const posts = await this.prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        orderBy: {
          viewCount: 'desc',
        },
        take: limit,
        select: {
          id: true,
        },
      });

      return posts.map((post) => post.id);
    } catch (error) {
      this.logger.error(`Error getting trending posts: ${error}`);
      return [];
    }
  }
}
