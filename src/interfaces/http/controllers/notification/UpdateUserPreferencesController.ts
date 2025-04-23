import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { INotificationService } from '../../../../application/services/notification/NotificationService.interface';
import container from '../../../../di/container';

export class UpdateUserPreferencesController extends BaseController {
  private notificationService: INotificationService;

  constructor() {
    super();
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const preferences = await this.notificationService.updateUserPreferences(
        req.user!.id,
        req.body,
      );

      ApiResponse.success(res, preferences, 'Notification preferences updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
