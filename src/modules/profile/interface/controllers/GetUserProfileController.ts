import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IProfileService } from '../../services/ProfileService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class GetUserProfileController extends BaseController {
  private profileService: IProfileService;

  constructor() {
    super();
    this.profileService = container.resolve<IProfileService>('profileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      const profile = await this.profileService.getProfileByUserId(userId);

      if (!profile) {
        throw AppError.notFound('Profile not found');
      }

      ApiResponse.success(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
