import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPostAnalyticsService } from '../../../../application/services/analytics/PostAnalyticsService.interface';
import { IPostRepository } from '../../../../domain/content/repositories/PostRepository.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class GetPostAnalyticsController extends BaseController {
  private postAnalyticsService: IPostAnalyticsService;
  private postRepository: IPostRepository;

  constructor() {
    super();
    this.postAnalyticsService = container.resolve<IPostAnalyticsService>('postAnalyticsService');
    this.postRepository = container.resolve<IPostRepository>('postRepository');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { postId } = req.params;

      // Verify post exists and user has permission
      const post = await this.postRepository.findByIdWithUser(postId);
      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      // Only the post owner can view analytics
      if (post.userId !== req.user!.id) {
        throw new AppError('You can only view analytics for your own posts', 403, 'FORBIDDEN');
      }

      const analytics = await this.postAnalyticsService.getPostAnalytics(postId);

      ApiResponse.success(
        res,
        analytics || { viewCount: 0, uniqueViewers: 0 },
        'Post analytics retrieved successfully',
      );
    } catch (error) {
      next(error);
    }
  }
}
