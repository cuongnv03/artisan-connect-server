import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IFollowService } from '../../services/FollowService.interface';
import container from '../../../../core/di/container';

export class UpdateFollowNotificationController extends BaseController {
  private followService: IFollowService;

  constructor() {
    super();
    this.followService = container.resolve<IFollowService>('followService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { userId } = req.params;
      const { notify } = req.body;

      const follow = await this.followService.updateNotificationPreference(
        req.user!.id,
        userId,
        notify,
      );

      ApiResponse.success(res, follow, 'Notification preference updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
