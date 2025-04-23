import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPostService } from '../../../../application/services/content/PostService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class GetPostBySlugController extends BaseController {
  private postService: IPostService;

  constructor() {
    super();
    this.postService = container.resolve<IPostService>('postService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const post = await this.postService.getPostBySlug(slug, req.user?.id);

      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      // Increment view count asynchronously
      this.postService.viewPost(post.id, req.user?.id).catch((err) => {
        this.logger.error(`Failed to increment view count: ${err}`);
      });

      ApiResponse.success(res, post, 'Post retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
