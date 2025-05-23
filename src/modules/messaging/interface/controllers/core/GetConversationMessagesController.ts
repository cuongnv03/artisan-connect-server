import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IMessageService } from '../../../services/MessageService.interface';
import container from '../../../../../core/di/container';

export class GetConversationMessagesController extends BaseController {
  private messageService: IMessageService;

  constructor() {
    super();
    this.messageService = container.resolve<IMessageService>('messageService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const messages = await this.messageService.getConversationMessages(
        req.user!.id,
        userId,
        page,
        limit,
      );

      ApiResponse.success(res, messages, 'Conversation messages retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
