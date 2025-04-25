import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPostAnalyticsService } from '../../services/PostAnalyticsService.interface';
import { IPostRepository } from '../../../post/repositories/PostRepository.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class GetPostInsightsController extends BaseController {
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
      const days = parseInt(req.query.days as string) || 30;

      // Verify post exists and user has permission
      const post = await this.postRepository.findByIdWithUser(postId);
      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      // Only the post owner can view insights
      if (post.userId !== req.user!.id) {
        throw new AppError('You can only view insights for your own posts', 403, 'FORBIDDEN');
      }

      const insights = await this.postAnalyticsService.getPostInsights(postId, days);

      ApiResponse.success(res, insights, 'Post insights retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
