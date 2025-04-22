import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IAuthService } from '../../../../application/services/auth/AuthService.interface';
import container from '../../../../di/container';

/**
 * Register controller
 */
export class RegisterController extends BaseController {
  private authService: IAuthService;

  constructor() {
    super();
    this.authService = container.resolve<IAuthService>('authService');
  }

  /**
   * Handle user registration
   */
  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.authService.register(req.body);

      ApiResponse.created(res, user, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }
}
