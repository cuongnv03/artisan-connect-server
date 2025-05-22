import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../../services/ArtisanProfileService.interface';
import container from '../../../../../core/di/container';

export class GetTopArtisansController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const artisans = await this.artisanProfileService.getTopArtisans(limit);

      ApiResponse.success(res, artisans, 'Top artisans retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
