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
    this.validateAuth(req);

    const {
      type,
      receiverId,
      content,
      customOrderData,
      quoteRequestId,
      response,
      counterOffer,
      acceptOffer,
      rejectOffer,
    } = req.body;

    let result;

    switch (type) {
      case 'create_custom_order':
        // Khách hàng tạo custom order mới qua chat
        result = await this.messageService.sendCustomOrderMessage(
          req.user!.id,
          receiverId,
          customOrderData,
          content,
        );
        break;

      case 'respond_custom_order':
        // Nghệ nhân phản hồi custom order qua chat
        result = await this.messageService.respondToCustomOrderInChat(
          req.user!.id,
          receiverId,
          quoteRequestId,
          {
            action: response.action,
            finalPrice: response.finalPrice,
            message: content,
            response: response.data,
            expiresInDays: response.expiresInDays,
          },
        );
        break;

      case 'customer_counter_offer':
        // Customer counter offer qua chat
        result = await this.messageService.customerCounterOfferInChat(
          req.user!.id,
          receiverId,
          quoteRequestId,
          {
            action: 'COUNTER_OFFER',
            finalPrice: counterOffer.finalPrice,
            timeline: counterOffer.timeline,
            message: content,
            response: counterOffer.data,
            expiresInDays: counterOffer.expiresInDays,
          },
        );
        break;

      case 'customer_accept_offer':
        // Customer accept offer qua chat
        result = await this.messageService.customerAcceptOfferInChat(
          req.user!.id,
          receiverId,
          quoteRequestId,
          {
            action: 'ACCEPT',
            message: content,
          },
        );
        break;

      case 'customer_reject_offer':
        // Customer reject offer qua chat
        result = await this.messageService.customerRejectOfferInChat(
          req.user!.id,
          receiverId,
          quoteRequestId,
          {
            action: 'REJECT',
            reason: rejectOffer.reason,
            message: content,
          },
        );
        break;

      case 'quote_discussion':
        // Tiếp tục thảo luận về quote
        result = await this.messageService.sendQuoteDiscussionMessage(
          req.user!.id,
          receiverId,
          quoteRequestId,
          content,
        );
        break;

      default:
        throw new Error('Invalid custom order message type');
    }

    ApiResponse.created(res, result, 'Custom order message sent successfully');
  }
}
