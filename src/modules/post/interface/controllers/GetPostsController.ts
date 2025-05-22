import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPostService } from '../../services/PostService.interface';
import { PostQueryOptions } from '../../models/Post';
import container from '../../../../core/di/container';

export class GetPostsController extends BaseController {
  private postService: IPostService;

  constructor() {
    super();
    this.postService = container.resolve<IPostService>('postService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options: PostQueryOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        userId: req.query.userId as string,
        type: req.query.type as any,
        status: req.query.status as any,
        tags: req.query.tags
          ? Array.isArray(req.query.tags)
            ? req.query.tags
            : [req.query.tags as string]
          : undefined,
        search: req.query.search as string,
        followedOnly: req.query.followedOnly === 'true',
        sortBy: (req.query.sortBy as any) || 'publishedAt',
        sortOrder: (req.query.sortOrder as any) || 'desc',
      };

      const posts = await this.postService.getPosts(options, req.user?.id);

      ApiResponse.success(res, posts, 'Posts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
