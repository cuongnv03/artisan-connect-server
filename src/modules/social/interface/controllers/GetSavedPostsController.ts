import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ISavedPostService } from '../../services/SavedPostService.interface';
import container from '../../../../core/di/container';

export class GetSavedPostsController extends BaseController {
  private savedPostService: ISavedPostService;

  constructor() {
    super();
    this.savedPostService = container.resolve<ISavedPostService>('savedPostService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const savedPosts = await this.savedPostService.getSavedPosts(req.user!.id, page, limit);

      ApiResponse.success(res, savedPosts, 'Saved posts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
