import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../../services/ArtisanProfileService.interface';
import container from '../../../../../core/di/container';

export class VerifyArtisanController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);
      this.validateRole(req, ['ADMIN']);

      const { profileId } = req.params;
      const { isVerified } = req.body;

      const profile = await this.artisanProfileService.verifyArtisan(profileId, isVerified);

      ApiResponse.success(
        res,
        profile,
        `Artisan ${isVerified ? 'verified' : 'unverified'} successfully`,
      );
    } catch (error) {
      next(error);
    }
  }
}
