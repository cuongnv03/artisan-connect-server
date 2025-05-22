import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../../services/ArtisanProfileService.interface';
import container from '../../../../../core/di/container';

export class GetTemplatePreviewController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { templateId } = req.params;
      const customData = req.body;

      const preview = await this.artisanProfileService.getTemplatePreview(templateId, customData);

      res.setHeader('Content-Type', 'text/html');
      res.send(preview);
    } catch (error) {
      next(error);
    }
  }
}
