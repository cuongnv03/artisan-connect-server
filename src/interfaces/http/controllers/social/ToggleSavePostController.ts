import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ISavedPostService } from '../../../../application/services/social/SavedPostService.interface';
import container from '../../../../di/container';

export class ToggleSavePostController extends BaseController {
  private savedPostService: ISavedPostService;

  constructor() {
    super();
    this.savedPostService = container.resolve<ISavedPostService>('savedPostService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { postId } = req.body;
      const isSaved = await this.savedPostService.toggleSavePost(req.user!.id, postId);

      ApiResponse.success(
        res,
        { saved: isSaved },
        isSaved ? 'Post saved successfully' : 'Post unsaved successfully',
      );
    } catch (error) {
      next(error);
    }
  }
}
