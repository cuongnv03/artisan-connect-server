import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPostAnalyticsService } from '../../services/PostAnalyticsService.interface';
import { IPostService } from '../../../post/services/PostService.interface';
import container from '../../../../core/di/container';

export class GetTrendingPostsController extends BaseController {
  private postAnalyticsService: IPostAnalyticsService;
  private postService: IPostService;

  constructor() {
    super();
    this.postAnalyticsService = container.resolve<IPostAnalyticsService>('postAnalyticsService');
    this.postService = container.resolve<IPostService>('postService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const days = parseInt(req.query.days as string) || 7;
      const requestUserId = req.user?.id;

      // Get trending post data
      const trendingData = await this.postAnalyticsService.getTrendingPosts(limit, days);

      // If no trending posts found
      if (trendingData.length === 0) {
        // Fallback to recent posts
        const regularPosts = await this.postService.getPosts(
          {
            status: 'PUBLISHED',
            sortBy: 'publishedAt',
            sortOrder: 'desc',
            limit,
          },
          requestUserId,
        );

        ApiResponse.success(res, regularPosts, 'Recent posts retrieved successfully');
        return;
      }

      // Get full post details for each trending post
      const trendingPosts = await Promise.all(
        trendingData.map(async (data) => {
          const post = await this.postService.getPostById(data.postId, requestUserId);
          return post ? { ...post, trendingData: data } : null;
        }),
      );

      // Filter out null values
      const validPosts = trendingPosts.filter((post) => post !== null);

      ApiResponse.success(
        res,
        {
          data: validPosts,
          meta: {
            total: validPosts.length,
            trending: true,
            days,
          },
        },
        'Trending posts retrieved successfully',
      );
    } catch (error) {
      next(error);
    }
  }
}
