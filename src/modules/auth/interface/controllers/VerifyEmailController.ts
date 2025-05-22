import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IAuthService } from '../../services/AuthService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class VerifyEmailController extends BaseController {
  private authService: IAuthService;

  constructor() {
    super();
    this.authService = container.resolve<IAuthService>('authService');
  }

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
