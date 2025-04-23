import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPostService } from '../../../../application/services/content/PostService.interface';
import { PostQueryOptions } from '../../../../domain/content/entities/Post';
import container from '../../../../di/container';

export class GetPostsController extends BaseController {
  private postService: IPostService;

  constructor() {
    super();
    this.postService = container.resolve<IPostService>('postService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Build options from query params
      const options: PostQueryOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        userId: req.query.userId as string,
        type: req.query.type as any,
        status: req.query.status as any,
        tag: req.query.tag as string,
        search: req.query.search as string,
        sortBy: (req.query.sortBy as any) || 'publishedAt',
        sortOrder: (req.query.sortOrder as any) || 'desc',
        followedOnly: req.query.followedOnly === 'true',
        includeLikeStatus: true,
        includeSaveStatus: true,
      };

      const posts = await this.postService.getPosts(options, req.user?.id);
      ApiResponse.success(res, posts, 'Posts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
