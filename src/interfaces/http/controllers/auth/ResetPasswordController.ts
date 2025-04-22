import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IAuthService } from '../../../../application/services/auth/AuthService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

/**
 * Reset password controller
 */
export class ResetPasswordController extends BaseController {
  private authService: IAuthService;

  constructor() {
    super();
    this.authService = container.resolve<IAuthService>('authService');
  }

  /**
   * Handle password reset request
   */
  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const success = await this.authService.resetPassword(req.body);

      if (!success) {
        throw AppError.badRequest('Invalid or expired token');
      }

      ApiResponse.success(res, null, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  }
}
