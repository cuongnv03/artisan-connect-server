import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../services/ArtisanProfileService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class GetArtisanProfileController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const profile = await this.artisanProfileService.getArtisanProfileById(id);

      if (!profile) {
        throw AppError.notFound('Artisan profile not found');
      }

      ApiResponse.success(res, profile, 'Artisan profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
