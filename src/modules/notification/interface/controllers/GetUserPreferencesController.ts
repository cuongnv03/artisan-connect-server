import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { INotificationService } from '../../application/NotificationService.interface';
import container from '../../../../core/di/container';

export class GetUserPreferencesController extends BaseController {
  private notificationService: INotificationService;

  constructor() {
    super();
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const preferences = await this.notificationService.getUserPreferences(req.user!.id);

      ApiResponse.success(res, preferences, 'Notification preferences retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
