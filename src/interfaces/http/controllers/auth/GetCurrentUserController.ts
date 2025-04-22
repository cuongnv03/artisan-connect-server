import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IAuthService } from '../../../../application/services/auth/AuthService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

/**
 * Get current user controller
 */
export class GetCurrentUserController extends BaseController {
  private authService: IAuthService;

  constructor() {
    super();
    this.authService = container.resolve<IAuthService>('authService');
  }

  /**
   * Handle get current user request
   */
  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const user = await this.authService.getUserById(req.user!.id);

      if (!user) {
        throw AppError.notFound('User not found');
      }

      ApiResponse.success(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
