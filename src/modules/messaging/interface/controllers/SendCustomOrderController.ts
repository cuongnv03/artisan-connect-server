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

      const { type, receiverId, content, customOrderData, quoteRequestId, response } = req.body;

      let message;

      switch (type) {
        case 'create_custom_order':
          // Khách hàng tạo custom order mới
          message = await this.messageService.sendCustomOrderMessage(
            req.user!.id,
            receiverId,
            customOrderData,
            content,
          );
          break;

        case 'respond_custom_order':
          // Nghệ nhân phản hồi custom order
          message = await this.messageService.respondToCustomOrderInChat(
            req.user!.id,
            receiverId,
            quoteRequestId,
            {
              action: response.action,
              finalPrice: response.finalPrice,
              message: content,
              response: response.data,
            },
          );
          break;

        case 'quote_discussion':
          // Tiếp tục thảo luận về quote
          message = await this.messageService.sendQuoteDiscussionMessage(
            req.user!.id,
            receiverId,
            quoteRequestId,
            content,
          );
          break;

        default:
          throw new Error('Invalid custom order message type');
      }

      ApiResponse.created(res, message, 'Custom order message sent successfully');
    } catch (error) {
      next(error);
    }
  }
}
