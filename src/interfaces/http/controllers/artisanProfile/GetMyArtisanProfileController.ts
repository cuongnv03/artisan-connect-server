import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../../../application/services/artisanProfile/ArtisanProfileService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

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
        // If profile not found, return specific message
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
