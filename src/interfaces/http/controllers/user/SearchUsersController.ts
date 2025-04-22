import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IUserService } from '../../../../application/services/user/UserService.interface';
import container from '../../../../di/container';

/**
 * Search users controller
 */
export class SearchUsersController extends BaseController {
  private userService: IUserService;

  constructor() {
    super();
    this.userService = container.resolve<IUserService>('userService');
  }

  /**
   * Handle search users request
   */
  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query.query as string) || '';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.userService.searchUsers(query, page, limit);

      ApiResponse.success(res, result, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
