import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { INotificationService } from '../../services/NotificationService.interface';
import { NotificationType } from '../../models/Notification';
import container from '../../../../core/di/container';

export class GetNotificationTypesController extends BaseController {
  private notificationService: INotificationService;

  constructor() {
    super();
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get all notification types
      const types = this.notificationService.getNotificationTypes();

      // Create a more descriptive response for the frontend
      const typeDescriptions = types.map((type) => {
        return {
          type,
          description: this.getTypeDescription(type),
        };
      });

      ApiResponse.success(res, typeDescriptions, 'Notification types retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  private getTypeDescription(type: NotificationType): string {
    const descriptions: Record<NotificationType, string> = {
      [NotificationType.LIKE]: 'When someone likes your post or comment',
      [NotificationType.COMMENT]: 'When someone comments on your post or replies to your comment',
      [NotificationType.FOLLOW]: 'When someone follows you',
      [NotificationType.MENTION]: 'When someone mentions you in a post or comment',
      [NotificationType.QUOTE_REQUEST]: 'When you receive a new quote request',
      [NotificationType.QUOTE_RESPONSE]: 'When an artisan responds to your quote request',
      [NotificationType.ORDER_STATUS]: 'When your order status changes',
      [NotificationType.MESSAGE]: 'When you receive a new message',
      [NotificationType.REVIEW]: 'When someone reviews your product',
      [NotificationType.NEW_POST]: 'When users you follow publish new posts',
      [NotificationType.SYSTEM]: 'Important system announcements',
    };

    return descriptions[type] || 'Notification from the system';
  }
}
