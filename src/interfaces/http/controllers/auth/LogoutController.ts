import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IAuthService } from '../../../../application/services/auth/AuthService.interface';
import { Config } from '../../../../config/config';
import container from '../../../../di/container';

/**
 * Logout controller
 */
export class LogoutController extends BaseController {
  private authService: IAuthService;
  private cookieConfig = Config.getCookieConfig();

  constructor() {
    super();
    this.authService = container.resolve<IAuthService>('authService');
  }

  /**
   * Handle user logout
   */
  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get refresh token from cookie or request body
      const refreshToken =
        req.signedCookies[this.cookieConfig.refreshTokenName] || req.body.refreshToken;

      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie(this.cookieConfig.refreshTokenName);

      ApiResponse.success(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }
}
