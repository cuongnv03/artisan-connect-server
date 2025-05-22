import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { ISavedPostService } from '../../../services/SavedPostService.interface';
import container from '../../../../../core/di/container';

export class CheckSavedStatusController extends BaseController {
  private savedPostService: ISavedPostService;

  constructor() {
    super();
    this.savedPostService = container.resolve<ISavedPostService>('savedPostService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { postId } = req.params;
      const saved = await this.savedPostService.hasSaved(req.user!.id, postId);

      ApiResponse.success(res, { saved }, 'Saved status retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
