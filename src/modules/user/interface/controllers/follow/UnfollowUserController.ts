import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IUserService } from '../../../services/UserService.interface';
import container from '../../../../../core/di/container';

export class UnfollowUserController extends BaseController {
  private userService: IUserService;

  constructor() {
    super();
    this.userService = container.resolve<IUserService>('userService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { userId } = req.params;
      const result = await this.userService.unfollowUser(req.user!.id, userId);

      if (result) {
        ApiResponse.success(res, null, 'User unfollowed successfully');
      } else {
        ApiResponse.success(res, null, 'User was not being followed');
      }
    } catch (error) {
      next(error);
    }
  }
}
