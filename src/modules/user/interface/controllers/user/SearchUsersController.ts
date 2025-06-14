import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IUserService } from '../../../services/UserService.interface';
import container from '../../../../../core/di/container';

export class SearchUsersController extends BaseController {
  private userService: IUserService;

  constructor() {
    super();
    this.userService = container.resolve<IUserService>('userService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const searchDto = {
        query: (req.query.query as string) || '',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        role: 'ARTISAN', // FORCE CHỈ TÌM ARTISAN
        status: req.query.status as string,
      };

      const result = await this.userService.searchUsers(searchDto);

      ApiResponse.success(res, result, 'Artisans retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
