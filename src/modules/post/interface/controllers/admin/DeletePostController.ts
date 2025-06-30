import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IPostService } from '../../../services/PostService.interface';
import { PostStatus } from '../../../models/Post';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class DeletePostController extends BaseController {
  private postService: IPostService;

  constructor() {
    super();
    this.postService = container.resolve<IPostService>('postService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateRole(req, ['ADMIN']);

      const { id } = req.params;
      await this.postService.deletePost(id, req.user!.id);

      ApiResponse.success(res, null, 'Post deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
