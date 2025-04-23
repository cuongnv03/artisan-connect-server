import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { INotificationService } from '../../../../application/services/notification/NotificationService.interface';
import container from '../../../../di/container';

export class MarkAllAsReadController extends BaseController {
  private notificationService: INotificationService;

  constructor() {
    super();
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const count = await this.notificationService.markAllAsRead(req.user!.id);

      ApiResponse.success(res, { count }, `${count} notifications marked as read`);
    } catch (error) {
      next(error);
    }
  }
}
