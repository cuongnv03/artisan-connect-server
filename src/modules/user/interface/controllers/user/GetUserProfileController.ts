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

      // BUSINESS RULE: Chỉ ARTISAN mới có public profile
      if (user.role !== 'ARTISAN') {
        throw AppError.forbidden('Profile not available', 'PROFILE_NOT_PUBLIC');
      }

      ApiResponse.success(res, user, 'User profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
