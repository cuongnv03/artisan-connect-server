import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../../../application/services/artisanProfile/ArtisanProfileService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class CreateArtisanProfileController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const profile = await this.artisanProfileService.createArtisanProfile(req.user!.id, req.body);

      ApiResponse.created(res, profile, 'Artisan profile created successfully');
    } catch (error) {
      next(error);
    }
  }
}
