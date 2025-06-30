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

    try {
      switch (type) {
        case 'create_custom_order':
          // FIXED: Create custom order and then send message card
          const customOrder = await this.messageService.createCustomOrderInChat(
            req.user!.id,
            receiverId,
            customOrderData,
          );

          // Send custom order card message
          result = await this.messageService.sendCustomOrderCardMessage(
            req.user!.id,
            receiverId,
            customOrder.id,
            content || `🛠️ Tôi có một đề xuất custom order: "${customOrder.title}"`,
            'create',
          );
          break;

        case 'respond_custom_order':
          // Artisan responds to custom order via chat
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
          // Customer counter offer via chat
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
          // Customer accept offer via chat
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
          // Customer reject offer via chat
          result = await this.messageService.customerRejectOfferInChat(
            req.user!.id,
            receiverId,
            quoteRequestId,
            {
              action: 'REJECT',
              reason: rejectOffer?.reason,
              message: content,
            },
          );
          break;

        case 'quote_discussion':
          // Continue discussion about quote
          result = await this.messageService.sendQuoteDiscussionMessage(
            req.user!.id,
            receiverId,
            quoteRequestId,
            content,
          );
          break;

        case 'send_existing_custom_order':
          // ADDED: Send existing custom order card (no creation)
          result = await this.messageService.sendCustomOrderCardMessage(
            req.user!.id,
            receiverId,
            quoteRequestId,
            content,
            'update',
          );
          break;

        default:
          throw new Error('Invalid custom order message type');
      }

      ApiResponse.created(res, result, 'Custom order message sent successfully');
    } catch (error: any) {
      this.logger?.error(`Custom order message error: ${error.message}`);
      throw error;
    }
  }
}
