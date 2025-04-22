import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IAuthService } from '../../../../application/services/auth/AuthService.interface';
import container from '../../../../di/container';

/**
 * Forgot password controller
 */
export class ForgotPasswordController extends BaseController {
  private authService: IAuthService;

  constructor() {
    super();
    this.authService = container.resolve<IAuthService>('authService');
  }

  /**
   * Handle forgot password request
   */
  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.authService.forgotPassword(req.body);

      // Always return success for security (don't reveal if email exists)
      ApiResponse.success(
        res,
        null,
        'If your email is registered, you will receive a password reset link',
      );
    } catch (error) {
      next(error);
    }
  }
}
