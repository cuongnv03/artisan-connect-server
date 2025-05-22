import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../../services/ArtisanProfileService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class GetMyArtisanProfileController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      try {
        const profile = await this.artisanProfileService.getMyArtisanProfile(req.user!.id);
        ApiResponse.success(res, profile, 'Artisan profile retrieved successfully');
      } catch (error) {
        if (error instanceof AppError && error.statusCode === 404) {
          ApiResponse.notFound(res, "You don't have an artisan profile yet");
        } else {
          throw error;
        }
      }
    } catch (error) {
      next(error);
    }
  }
}
