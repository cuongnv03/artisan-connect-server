import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IAuthService } from '../../../../application/services/auth/AuthService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

/**
 * Verify email controller
 */
export class VerifyEmailController extends BaseController {
  private authService: IAuthService;

  constructor() {
    super();
    this.authService = container.resolve<IAuthService>('authService');
  }

  /**
   * Handle email verification request
   */
  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      const success = await this.authService.verifyEmail(token);

      if (!success) {
        throw AppError.badRequest('Invalid or expired verification token');
      }

      ApiResponse.success(res, null, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  }
}
