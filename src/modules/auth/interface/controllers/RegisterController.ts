import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IAuthService } from '../../services/AuthService.interface';
import container from '../../../../core/di/container';

export class RegisterController extends BaseController {
  private authService: IAuthService;

  constructor() {
    super();
    this.authService = container.resolve<IAuthService>('authService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.authService.register(req.body);
      ApiResponse.created(res, user, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }
}
