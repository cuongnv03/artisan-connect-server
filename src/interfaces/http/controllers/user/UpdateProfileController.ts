import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IUserService } from '../../../../application/services/user/UserService.interface';
import container from '../../../../di/container';

/**
 * Update profile controller
 */
export class UpdateProfileController extends BaseController {
  private userService: IUserService;

  constructor() {
    super();
    this.userService = container.resolve<IUserService>('userService');
  }

  /**
   * Handle profile update request
   */
  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const updatedUser = await this.userService.updateProfile(req.user!.id, req.body);

      ApiResponse.success(res, updatedUser, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
