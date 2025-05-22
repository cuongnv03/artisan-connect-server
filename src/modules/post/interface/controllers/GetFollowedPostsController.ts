import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPostService } from '../../services/PostService.interface';
import container from '../../../../core/di/container';

export class GetFollowedPostsController extends BaseController {
  private postService: IPostService;

  constructor() {
    super();
    this.postService = container.resolve<IPostService>('postService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const options = {
        type: req.query.type as any,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sortBy: (req.query.sortBy as any) || 'publishedAt',
        sortOrder: (req.query.sortOrder as any) || 'desc',
      };

      const posts = await this.postService.getFollowedPosts(req.user!.id, options);

      ApiResponse.success(res, posts, 'Followed posts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
