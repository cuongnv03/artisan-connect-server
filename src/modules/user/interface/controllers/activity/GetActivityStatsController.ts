import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IUserService } from '../../../services/UserService.interface';
import container from '../../../../../core/di/container';

export class GetActivityStatsController extends BaseController {
  private userService: IUserService;

  constructor() {
    super();
    this.userService = container.resolve<IUserService>('userService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const days = parseInt(req.query.days as string) || 30;

      const stats = await this.userService.getActivityStats(req.user!.id, days);

      ApiResponse.success(res, stats, 'Activity stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
