import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IUserService } from '../../../../application/services/user/UserService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

/**
 * Get user profile controller
 */
export class GetUserProfileController extends BaseController {
  private userService: IUserService;

  constructor() {
    super();
    this.userService = container.resolve<IUserService>('userService');
  }

  /**
   * Handle get user profile request
   */
  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await this.userService.getUserById(id);

      if (!user) {
        throw AppError.notFound('User not found');
      }

      ApiResponse.success(res, user, 'User profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
