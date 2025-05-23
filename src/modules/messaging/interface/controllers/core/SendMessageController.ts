import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IMessageService } from '../../../services/MessageService.interface';
import container from '../../../../../core/di/container';

export class SendMessageController extends BaseController {
  private messageService: IMessageService;

  constructor() {
    super();
    this.messageService = container.resolve<IMessageService>('messageService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const message = await this.messageService.sendMessage(req.user!.id, req.body);

      ApiResponse.created(res, message, 'Message sent successfully');
    } catch (error) {
      next(error);
    }
  }
}
