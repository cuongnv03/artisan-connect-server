import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../application/ArtisanProfileService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class GetArtisanProfileByUserIdController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      const profile = await this.artisanProfileService.getArtisanProfileByUserId(userId);

      if (!profile) {
        throw AppError.notFound('Artisan profile not found for this user');
      }

      ApiResponse.success(res, profile, 'Artisan profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
