import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPostService } from '../../services/PostService.interface';
import container from '../../../../core/di/container';

export class GetMyPostsController extends BaseController {
  private postService: IPostService;

  constructor() {
    super();
    this.postService = container.resolve<IPostService>('postService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      // Get query params
      const status = req.query.status as any;
      const type = req.query.type as any;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = (req.query.sortBy as any) || 'updatedAt';
      const sortOrder = (req.query.sortOrder as any) || 'desc';

      const posts = await this.postService.getMyPosts(req.user!.id, {
        status,
        type,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      // Get post counts by status
      const statusCounts = await this.postService.getPostStatusCounts(req.user!.id);

      ApiResponse.success(
        res,
        {
          posts,
          statusCounts,
        },
        'My posts retrieved successfully',
      );
    } catch (error) {
      next(error);
    }
  }
}
