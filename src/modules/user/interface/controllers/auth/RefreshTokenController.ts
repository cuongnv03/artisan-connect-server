import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IAuthService } from '../../../application/AuthService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import { Config } from '../../../../../config/config';
import container from '../../../../../core/di/container';

/**
 * Refresh token controller
 */
export class RefreshTokenController extends BaseController {
  private authService: IAuthService;
  private cookieConfig = Config.getCookieConfig();

  constructor() {
    super();
    this.authService = container.resolve<IAuthService>('authService');
  }

  /**
   * Handle token refresh
   */
  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get refresh token from cookie or request body
      const refreshToken =
        req.signedCookies[this.cookieConfig.refreshTokenName] || req.body.refreshToken;

      if (!refreshToken) {
        throw AppError.unauthorized('Refresh token not provided');
      }

      // Generate new access token
      const accessToken = await this.authService.refreshToken(refreshToken);

      if (!accessToken) {
        // Clear invalid refresh token cookie
        res.clearCookie(this.cookieConfig.refreshTokenName);
        throw AppError.unauthorized('Invalid refresh token');
      }

      ApiResponse.success(res, { accessToken }, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }
}
