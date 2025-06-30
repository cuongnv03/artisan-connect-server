import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IPostService } from '../../../services/PostService.interface';
import { PostQueryOptions } from '../../../models/Post';
import container from '../../../../../core/di/container';

export class GetAllPostsController extends BaseController {
  private postService: IPostService;

  constructor() {
    super();
    this.postService = container.resolve<IPostService>('postService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate admin role
      this.validateRole(req, ['ADMIN']);

      const options: PostQueryOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        type: req.query.type as any,
        status: req.query.status as any,
        search: req.query.search as string,
        sortBy: (req.query.sortBy as any) || 'createdAt',
        sortOrder: (req.query.sortOrder as any) || 'desc',
        // Admin có thể xem tất cả posts, kể cả draft và archived
      };

      const posts = await this.postService.getPosts(options);

      ApiResponse.success(res, posts, 'Posts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
