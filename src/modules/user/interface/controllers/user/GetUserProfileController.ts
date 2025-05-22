import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IUserService } from '../../../services/UserService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class GetUserProfileController extends BaseController {
  private userService: IUserService;

  constructor() {
    super();
    this.userService = container.resolve<IUserService>('userService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await this.userService.getUserById(id);

      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Track profile view if authenticated and not own profile
      if (req.user && req.user.id !== id) {
        await this.userService.trackActivity({
          userId: req.user.id,
          activityType: 'profile_view',
          entityId: id,
          entityType: 'user',
        });
      }

      ApiResponse.success(res, user, 'User profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
