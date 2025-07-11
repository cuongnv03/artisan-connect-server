import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IAuthService } from '../../services/AuthService.interface';
import container from '../../../../core/di/container';

export class ForgotPasswordController extends BaseController {
  private authService: IAuthService;

  constructor() {
    super();
    this.authService = container.resolve<IAuthService>('authService');
  }

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
