import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IArtisanProfileService } from '../../../services/ArtisanProfileService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class RejectUpgradeRequestController extends BaseController {
  private artisanProfileService: IArtisanProfileService;

  constructor() {
    super();
    this.artisanProfileService = container.resolve<IArtisanProfileService>('artisanProfileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);
      this.validateRole(req, ['ADMIN']);

      const { id } = req.params;
      const { adminNotes } = req.body;

      if (!adminNotes) {
        throw AppError.badRequest('Admin notes are required when rejecting a request');
      }

      const request = await this.artisanProfileService.rejectUpgradeRequest(
        id,
        req.user!.id,
        adminNotes,
      );

      ApiResponse.success(res, request, 'Upgrade request rejected successfully');
    } catch (error) {
      next(error);
    }
  }
}
