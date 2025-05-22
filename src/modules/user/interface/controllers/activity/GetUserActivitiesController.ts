import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IUserService } from '../../../services/UserService.interface';
import container from '../../../../../core/di/container';

export class GetUserActivitiesController extends BaseController {
  private userService: IUserService;

  constructor() {
    super();
    this.userService = container.resolve<IUserService>('userService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const activityTypes = req.query.types ? (req.query.types as string).split(',') : undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const activities = await this.userService.getUserActivities(
        req.user!.id,
        activityTypes,
        page,
        limit,
      );

      ApiResponse.success(res, activities, 'User activities retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
