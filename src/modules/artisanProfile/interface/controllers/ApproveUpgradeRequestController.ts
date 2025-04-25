import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../services/ArtisanProfileService.interface';
import container from '../../../../core/di/container';

export class ApproveUpgradeRequestController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      // Ensure user is admin
      this.validateRole(req, ['ADMIN']);

      const { id } = req.params;
      const { adminNotes } = req.body;

      const request = await this.artisanProfileService.approveUpgradeRequest(id, adminNotes);

      ApiResponse.success(res, request, 'Upgrade request approved successfully');
    } catch (error) {
      next(error);
    }
  }
}
