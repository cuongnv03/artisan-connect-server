import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IPostAnalyticsRepository } from './PostAnalyticsRepository.interface';
import { PostAnalytics, PostInsightsDto, TrendingPostData } from '../models/PostAnalytics';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

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
   * Create or update analytics for a post
   */
  async upsertAnalytics(postId: string, data: Partial<PostAnalytics>): Promise<PostAnalytics> {
    try {
      const analytics = await this.prisma.postAnalytics.upsert({
        where: { postId },
        update: {
          ...data,
          updatedAt: new Date(),
        },
        create: {
          postId,
          viewCount: data.viewCount || 0,
          uniqueViewers: data.uniqueViewers || 0,
          avgReadTime: data.avgReadTime || null,
          conversionCount: data.conversionCount || 0,
        },
      });

      return analytics as PostAnalytics;
    } catch (error) {
      this.logger.error(`Error upserting analytics: ${error}`);
      throw new AppError('Failed to update analytics', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Track a view event
   */
  async trackView(postId: string, isUnique: boolean): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Update analytics
        await tx.postAnalytics.upsert({
          where: { postId },
          update: {
            viewCount: { increment: 1 },
            uniqueViewers: isUnique ? { increment: 1 } : undefined,
            updatedAt: new Date(),
          },
          create: {
            postId,
            viewCount: 1,
            uniqueViewers: isUnique ? 1 : 0,
            conversionCount: 0,
          },
        });

        // Also update view count in the post itself
        await tx.post.update({
          where: { id: postId },
          data: {
            viewCount: { increment: 1 },
          },
        });
      });

      this.logger.debug(`View tracked for post ${postId}, unique: ${isUnique}`);
    } catch (error) {
      this.logger.error(`Error tracking view: ${error}`);
      // Non-critical operation, don't throw
    }
  }

  /**
   * Track a conversion event
   */
  async trackConversion(postId: string): Promise<void> {
    try {
      await this.prisma.postAnalytics.upsert({
        where: { postId },
        update: {
          conversionCount: { increment: 1 },
          updatedAt: new Date(),
        },
        create: {
          postId,
          viewCount: 0,
          uniqueViewers: 0,
          conversionCount: 1,
        },
      });

      this.logger.info(`Conversion tracked for post ${postId}`);
    } catch (error) {
      this.logger.error(`Error tracking conversion: ${error}`);
      // Non-critical operation, don't throw
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
          updatedAt: new Date(),
        },
      });

      this.logger.debug(`Updated read time for post ${postId}: ${timeSpent}s -> avg: ${newAvg}s`);
    } catch (error) {
      this.logger.error(`Error updating average read time: ${error}`);
      // Non-critical operation, don't throw
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
          id: true,
          title: true,
          publishedAt: true,
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

      // Generate trend data (simplified - in production, you'd store daily metrics)
      const trendData = this.generateTrendData(analytics, days);

      // Calculate performance metrics
      const conversionRate =
        analytics.viewCount > 0 ? (analytics.conversionCount / analytics.viewCount) * 100 : 0;

      const engagementRate =
        analytics.viewCount > 0
          ? ((post._count.likes + post._count.comments + post._count.savedBy) /
              analytics.viewCount) *
            100
          : 0;

      return {
        analytics: analytics as PostAnalytics,
        trendData,
        performanceMetrics: {
          avgReadTime: analytics.avgReadTime,
          conversionRate,
          engagementRate,
        },
        interactionData: {
          likes: post._count.likes,
          comments: post._count.comments,
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
  async getTrendingPosts(limit: number = 10, days: number = 7): Promise<TrendingPostData[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Get posts updated recently with their analytics
      const posts = await this.prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          publishedAt: {
            gte: cutoffDate,
          },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          publishedAt: true,
          analytics: {
            select: {
              viewCount: true,
              uniqueViewers: true,
              conversionCount: true,
              updatedAt: true,
            },
          },
        },
        orderBy: [
          {
            analytics: {
              viewCount: 'desc',
            },
          },
          {
            analytics: {
              uniqueViewers: 'desc',
            },
          },
        ],
        take: limit,
      });

      return posts
        .filter((post) => post.analytics)
        .map((post) => {
          const analytics = post.analytics!;
          // Simple growth rate calculation (views per day since published)
          const daysSincePublished = post.publishedAt
            ? Math.max(
                1,
                Math.floor((Date.now() - post.publishedAt.getTime()) / (1000 * 60 * 60 * 24)),
              )
            : 1;
          const growthRate = analytics.viewCount / daysSincePublished;

          return {
            postId: post.id,
            title: post.title,
            slug: post.slug,
            viewCount: analytics.viewCount,
            uniqueViewers: analytics.uniqueViewers,
            conversionCount: analytics.conversionCount,
            growthRate,
            publishedAt: post.publishedAt,
          };
        });
    } catch (error) {
      this.logger.error(`Error getting trending posts: ${error}`);
      return [];
    }
  }

  /**
   * Get analytics for multiple posts
   */
  async getPostsAnalytics(postIds: string[]): Promise<PostAnalytics[]> {
    try {
      const analytics = await this.prisma.postAnalytics.findMany({
        where: {
          postId: { in: postIds },
        },
      });

      return analytics as PostAnalytics[];
    } catch (error) {
      this.logger.error(`Error getting posts analytics: ${error}`);
      return [];
    }
  }

  /**
   * Get user's posts analytics summary
   */
  async getUserPostsAnalyticsSummary(userId: string): Promise<{
    totalPosts: number;
    totalViews: number;
    totalUniqueViewers: number;
    totalConversions: number;
    avgReadTime: number | null;
  }> {
    try {
      // Get user's posts
      const userPosts = await this.prisma.post.findMany({
        where: {
          userId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      const totalPosts = userPosts.length;
      const postIds = userPosts.map((post) => post.id);

      if (postIds.length === 0) {
        return {
          totalPosts: 0,
          totalViews: 0,
          totalUniqueViewers: 0,
          totalConversions: 0,
          avgReadTime: null,
        };
      }

      // Get analytics for these posts
      const analytics = await this.prisma.postAnalytics.findMany({
        where: {
          postId: { in: postIds },
        },
        select: {
          viewCount: true,
          uniqueViewers: true,
          conversionCount: true,
          avgReadTime: true,
        },
      });

      let totalViews = 0;
      let totalUniqueViewers = 0;
      let totalConversions = 0;
      let totalReadTime = 0;
      let readTimeCount = 0;

      analytics.forEach((analytic) => {
        totalViews += analytic.viewCount;
        totalUniqueViewers += analytic.uniqueViewers;
        totalConversions += analytic.conversionCount;

        if (analytic.avgReadTime) {
          totalReadTime += analytic.avgReadTime;
          readTimeCount++;
        }
      });

      const avgReadTime = readTimeCount > 0 ? totalReadTime / readTimeCount : null;

      return {
        totalPosts,
        totalViews,
        totalUniqueViewers,
        totalConversions,
        avgReadTime,
      };
    } catch (error) {
      this.logger.error(`Error getting user posts analytics summary: ${error}`);
      throw new AppError('Failed to get analytics summary', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Clean up old analytics data
   */
  async cleanupOldData(daysToKeep: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.prisma.postAnalytics.deleteMany({
        where: {
          updatedAt: {
            lt: cutoffDate,
          },
          post: {
            deletedAt: {
              not: null,
            },
          },
        },
      });

      this.logger.info(`Cleaned up ${result.count} old analytics records`);
      return result.count;
    } catch (error) {
      this.logger.error(`Error cleaning up old analytics data: ${error}`);
      return 0;
    }
  }

  /**
   * Generate trend data for insights
   */
  private generateTrendData(
    analytics: any,
    days: number,
  ): { date: string; views: number; uniqueViews: number }[] {
    const trendData = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      // Simulate daily distribution (in production, store daily metrics)
      const dailyViews = Math.floor((analytics.viewCount / days) * (0.5 + Math.random()));
      const dailyUniqueViews = Math.floor((analytics.uniqueViewers / days) * (0.5 + Math.random()));

      trendData.push({
        date: date.toISOString().split('T')[0],
        views: dailyViews,
        uniqueViews: dailyUniqueViews,
      });
    }

    return trendData;
  }
}
