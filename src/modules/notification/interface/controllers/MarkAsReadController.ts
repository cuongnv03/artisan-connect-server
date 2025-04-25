import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { INotificationService } from '../../application/NotificationService.interface';
import container from '../../../../core/di/container';

export class MarkAsReadController extends BaseController {
  private notificationService: INotificationService;

  constructor() {
    super();
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { id } = req.params;
      await this.notificationService.markAsRead(id, req.user!.id);

      ApiResponse.success(res, null, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }
}
