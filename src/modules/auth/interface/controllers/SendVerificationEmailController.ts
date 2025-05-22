import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IAuthService } from '../../services/AuthService.interface';
import container from '../../../../core/di/container';

export class SendVerificationEmailController extends BaseController {
  private authService: IAuthService;

  constructor() {
    super();
    this.authService = container.resolve<IAuthService>('authService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      await this.authService.sendVerificationEmail(req.user!.id);

      ApiResponse.success(
        res,
        null,
        'Verification email sent successfully. Please check your inbox.',
      );
    } catch (error) {
      next(error);
    }
  }
}
