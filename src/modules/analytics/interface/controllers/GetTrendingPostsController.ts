import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPostAnalyticsService } from '../../application/PostAnalyticsService.interface';
import { IPostService } from '../../../content/application/PostService.interface';
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
      const requestUserId = req.user?.id;

      // Get trending post IDs
      const trendingPostIds = await this.postAnalyticsService.getTrendingPosts(limit);

      // If no trending posts found
      if (trendingPostIds.length === 0) {
        // Fallback to regular posts
        const regularPosts = await this.postService.getPosts(
          {
            status: 'PUBLISHED',
            sortBy: 'createdAt',
            sortOrder: 'desc',
            limit,
            includeLikeStatus: !!requestUserId,
            includeSaveStatus: !!requestUserId,
          },
          requestUserId,
        );

        ApiResponse.success(res, regularPosts, 'Recent posts retrieved successfully');
        return;
      }

      // Get full post details for each trending post
      const trendingPosts = await Promise.all(
        trendingPostIds.map((id) => this.postService.getPostById(id, requestUserId)),
      );

      // Filter out null values (posts that might have been deleted or are no longer accessible)
      const validPosts = trendingPosts.filter((post) => post !== null);

      ApiResponse.success(
        res,
        {
          data: validPosts,
          meta: {
            total: validPosts.length,
            trending: true,
          },
        },
        'Trending posts retrieved successfully',
      );
    } catch (error) {
      next(error);
    }
  }
}
