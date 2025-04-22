import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../../../application/services/artisanProfile/ArtisanProfileService.interface';
import container from '../../../../di/container';

export class GetDefaultTemplatesController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = await this.artisanProfileService.getDefaultTemplates();

      ApiResponse.success(res, templates, 'Default templates retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
