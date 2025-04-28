import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IProfileService } from '../../services/ProfileService.interface';
import container from '../../../../core/di/container';

export class UpdateProfileController extends BaseController {
  private profileService: IProfileService;

  constructor() {
    super();
    this.profileService = container.resolve<IProfileService>('profileService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const profile = await this.profileService.updateProfile(req.user!.id, req.body);

      ApiResponse.success(res, profile, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
