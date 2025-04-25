import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IUserService } from '../../../services/UserService.interface';
import container from '../../../../../core/di/container';

/**
 * Delete account controller
 */
export class DeleteAccountController extends BaseController {
  private userService: IUserService;

  constructor() {
    super();
    this.userService = container.resolve<IUserService>('userService');
  }

  /**
   * Handle delete account request
   */
  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      await this.userService.deleteAccount(req.user!.id);

      // Clear any cookies
      res.clearCookie('refresh_token');

      ApiResponse.success(res, null, 'Account deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
