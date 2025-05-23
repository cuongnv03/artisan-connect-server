import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { INotificationService } from '../../services/NotificationService.interface';
import { NotificationQueryOptions } from '../../models/Notification';
import container from '../../../../core/di/container';

export class GetNotificationsController extends BaseController {
  private notificationService: INotificationService;

  constructor() {
    super();
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const options: NotificationQueryOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        isRead: req.query.isRead ? req.query.isRead === 'true' : undefined,
        types: req.query.types
          ? Array.isArray(req.query.types)
            ? (req.query.types as any[])
            : [req.query.types as any]
          : undefined,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };

      const notifications = await this.notificationService.getUserNotifications(
        req.user!.id,
        options,
      );

      ApiResponse.success(res, notifications, 'Notifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
