import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IMessageService } from '../../services/MessageService.interface';
import { MessageQueryOptions } from '../../models/Message';
import container from '../../../../core/di/container';

export class GetMessagesController extends BaseController {
  private messageService: IMessageService;

  constructor() {
    super();
    this.messageService = container.resolve<IMessageService>('messageService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const options: MessageQueryOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        conversationWith: req.query.conversationWith as string,
        type: req.query.type as any,
        isRead: req.query.isRead ? req.query.isRead === 'true' : undefined,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };

      const messages = await this.messageService.getMessages(req.user!.id, options);

      ApiResponse.success(res, messages, 'Messages retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
