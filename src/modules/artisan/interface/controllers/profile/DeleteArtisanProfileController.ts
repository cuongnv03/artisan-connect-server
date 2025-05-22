import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../../services/ArtisanProfileService.interface';
import container from '../../../../../core/di/container';

export class DeleteArtisanProfileController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);
      this.validateRole(req, ['ARTISAN']);

      await this.artisanProfileService.deleteArtisanProfile(req.user!.id);

      ApiResponse.success(res, null, 'Artisan profile deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
