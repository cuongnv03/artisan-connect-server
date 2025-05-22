import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPostService } from '../../services/PostService.interface';
import container from '../../../../core/di/container';

export class CreatePostController extends BaseController {
  private postService: IPostService;

  constructor() {
    super();
    this.postService = container.resolve<IPostService>('postService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const post = await this.postService.createPost(req.user!.id, req.body);

      ApiResponse.created(res, post, 'Post created successfully');
    } catch (error) {
      next(error);
    }
  }
}
