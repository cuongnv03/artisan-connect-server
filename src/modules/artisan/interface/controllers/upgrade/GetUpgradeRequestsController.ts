import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../../services/ArtisanProfileService.interface';
import { UpgradeRequestStatus } from '../../../models/ArtisanEnums';
import container from '../../../../../core/di/container';

export class GetUpgradeRequestsController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);
      this.validateRole(req, ['ADMIN']);

      const status = req.query.status as UpgradeRequestStatus;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const requests = await this.artisanProfileService.getUpgradeRequests(status, page, limit);

      ApiResponse.success(res, requests, 'Upgrade requests retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
