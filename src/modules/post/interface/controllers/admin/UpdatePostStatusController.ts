import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IPostService } from '../../../services/PostService.interface';
import { PostStatus } from '../../../models/Post';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class UpdatePostStatusController extends BaseController {
  private postService: IPostService;

  constructor() {
    super();
    this.postService = container.resolve<IPostService>('postService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate admin role
      this.validateRole(req, ['ADMIN']);

      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(PostStatus).includes(status)) {
        throw AppError.badRequest('Invalid status value');
      }

      let post;

      // Handle different status transitions
      switch (status) {
        case PostStatus.PUBLISHED:
          post = await this.postService.publishPost(id, req.user!.id);
          break;
        case PostStatus.ARCHIVED:
          post = await this.postService.archivePost(id, req.user!.id);
          break;
        case PostStatus.DELETED:
          await this.postService.deletePost(id, req.user!.id);
          ApiResponse.success(res, null, 'Post deleted successfully');
        default:
          throw AppError.badRequest('Invalid status transition');
      }

      ApiResponse.success(res, post, 'Post status updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
