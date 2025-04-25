import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../application/ArtisanProfileService.interface';
import container from '../../../../core/di/container';

export class GetUpgradeRequestStatusController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const status = await this.artisanProfileService.getUpgradeRequestStatus(req.user!.id);

      ApiResponse.success(res, status, 'Upgrade request status retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
