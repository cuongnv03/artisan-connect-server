import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPostService } from '../../../../application/services/content/PostService.interface';
import container from '../../../../di/container';

export class PublishPostController extends BaseController {
  private postService: IPostService;

  constructor() {
    super();
    this.postService = container.resolve<IPostService>('postService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { id } = req.params;
      const post = await this.postService.publishPost(id, req.user!.id);

      ApiResponse.success(res, post, 'Post published successfully');
    } catch (error) {
      next(error);
    }
  }
}
