import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IAuthService } from '../../../services/AuthService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import { Config } from '../../../../../config/config';
import container from '../../../../../core/di/container';

/**
 * Login controller
 */
export class LoginController extends BaseController {
  private authService: IAuthService;
  private cookieConfig = Config.getCookieConfig();

  constructor() {
    super();
    this.authService = container.resolve<IAuthService>('authService');
  }

  /**
   * Handle user login
   */
  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authResult = await this.authService.login(req.body);

      if (!authResult) {
        throw AppError.unauthorized('Invalid credentials');
      }

      // Set refresh token cookie
      res.cookie(this.cookieConfig.refreshTokenName, authResult.refreshToken, {
        httpOnly: true,
        secure: Config.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: this.cookieConfig.maxAge,
        signed: true,
      });

      // Return user data and access token
      ApiResponse.success(
        res,
        {
          user: authResult.user,
          accessToken: authResult.accessToken,
        },
        'Login successful',
      );
    } catch (error) {
      next(error);
    }
  }
}
