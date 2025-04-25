import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ISavedPostService } from '../../application/SavedPostService.interface';
import container from '../../../../core/di/container';

export class SavePostController extends BaseController {
  private savedPostService: ISavedPostService;

  constructor() {
    super();
    this.savedPostService = container.resolve<ISavedPostService>('savedPostService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { postId } = req.body;
      await this.savedPostService.savePost(req.user!.id, postId);

      ApiResponse.success(res, { saved: true }, 'Post saved successfully');
    } catch (error) {
      next(error);
    }
  }
}
