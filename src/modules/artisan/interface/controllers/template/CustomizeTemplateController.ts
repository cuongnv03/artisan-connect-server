import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../../services/ArtisanProfileService.interface';
import container from '../../../../../core/di/container';

export class CustomizeTemplateController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);
      this.validateRole(req, ['ARTISAN']);

      const result = await this.artisanProfileService.customizeTemplate(req.user!.id, req.body);

      ApiResponse.success(res, result, 'Template customized successfully');
    } catch (error) {
      next(error);
    }
  }
}
