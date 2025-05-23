import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { INotificationService } from '../../services/NotificationService.interface';
import container from '../../../../core/di/container';

export class GetUnreadCountController extends BaseController {
  private notificationService: INotificationService;

  constructor() {
    super();
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const count = await this.notificationService.getUnreadCount(req.user!.id);

      ApiResponse.success(res, { unreadCount: count }, 'Unread count retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
