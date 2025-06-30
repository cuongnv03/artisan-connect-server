import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IUserService } from '../../../services/UserService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class DeleteUserController extends BaseController {
  private userService: IUserService;

  constructor() {
    super();
    this.userService = container.resolve<IUserService>('userService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);
      this.validateRole(req, ['ADMIN']);

      const { id } = req.params;
      const adminId = req.user!.id;

      const result = await this.userService.adminDeleteUser(id, adminId);

      if (result) {
        ApiResponse.success(res, null, 'User deleted successfully');
      } else {
        throw AppError.badRequest('Failed to delete user');
      }
    } catch (error) {
      next(error);
    }
  }
}
