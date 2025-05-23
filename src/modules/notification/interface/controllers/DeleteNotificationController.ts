import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { INotificationService } from '../../services/NotificationService.interface';
import container from '../../../../core/di/container';

export class DeleteNotificationController extends BaseController {
  private notificationService: INotificationService;

  constructor() {
    super();
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { id } = req.params;
      const result = await this.notificationService.deleteNotification(id, req.user!.id);

      if (result) {
        ApiResponse.success(res, null, 'Notification deleted successfully');
      } else {
        ApiResponse.notFound(res, 'Notification not found');
      }
    } catch (error) {
      next(error);
    }
  }
}
