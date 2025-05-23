import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IMessageService } from '../../../services/MessageService.interface';
import container from '../../../../../core/di/container';

export class GetUnreadCountController extends BaseController {
  private messageService: IMessageService;

  constructor() {
    super();
    this.messageService = container.resolve<IMessageService>('messageService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const count = await this.messageService.getUnreadMessageCount(req.user!.id);

      ApiResponse.success(
        res,
        { unreadCount: count },
        'Unread message count retrieved successfully',
      );
    } catch (error) {
      next(error);
    }
  }
}
