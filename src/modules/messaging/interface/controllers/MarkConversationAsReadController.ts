import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IMessageService } from '../../services/MessageService.interface';
import container from '../../../../core/di/container';

export class MarkConversationAsReadController extends BaseController {
  private messageService: IMessageService;

  constructor() {
    super();
    this.messageService = container.resolve<IMessageService>('messageService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { userId } = req.params;
      const count = await this.messageService.markConversationAsRead(req.user!.id, userId);

      ApiResponse.success(res, { markedCount: count }, `${count} messages marked as read`);
    } catch (error) {
      next(error);
    }
  }
}
