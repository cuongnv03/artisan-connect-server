import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPostService } from '../../../../application/services/content/PostService.interface';
import container from '../../../../di/container';

export class GetFollowedPostsController extends BaseController {
  private postService: IPostService;

  constructor() {
    super();
    this.postService = container.resolve<IPostService>('postService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      // Get query params
      const type = req.query.type as any;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = (req.query.sortBy as any) || 'publishedAt';
      const sortOrder = (req.query.sortOrder as any) || 'desc';

      const posts = await this.postService.getFollowedPosts(req.user!.id, {
        type,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      ApiResponse.success(res, posts, 'Followed posts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
