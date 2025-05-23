import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IMessageService } from '../../services/MessageService.interface';
import container from '../../../../core/di/container';

export class SendCustomOrderController extends BaseController {
  private messageService: IMessageService;

  constructor() {
    super();
    this.messageService = container.resolve<IMessageService>('messageService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { receiverId, content, orderData } = req.body;

      const message = await this.messageService.sendCustomOrderMessage(
        req.user!.id,
        receiverId,
        orderData,
        content,
      );

      ApiResponse.created(res, message, 'Custom order message sent successfully');
    } catch (error) {
      next(error);
    }
  }
}
