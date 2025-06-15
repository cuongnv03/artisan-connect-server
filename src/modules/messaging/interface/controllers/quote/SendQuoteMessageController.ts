import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IMessageService } from '../../../services/MessageService.interface';
import { IQuoteService } from '../../../../custom-order/services/CustomOrderService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class SendQuoteMessageController extends BaseController {
  private messageService: IMessageService;
  private quoteService: IQuoteService;

  constructor() {
    super();
    this.messageService = container.resolve<IMessageService>('messageService');
    this.quoteService = container.resolve<IQuoteService>('quoteService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { quoteId, content } = req.body;

      // Validate quote access
      const hasAccess = await this.quoteService.validateQuoteAccess(quoteId, req.user!.id);
      if (!hasAccess) {
        throw new AppError('You do not have access to this quote', 403, 'QUOTE_ACCESS_DENIED');
      }

      // Get quote to determine receiver
      const quote = await this.quoteService.getQuoteById(quoteId);
      if (!quote) {
        throw new AppError('Quote not found', 404, 'QUOTE_NOT_FOUND');
      }

      // Determine receiver (if sender is customer, receiver is artisan and vice versa)
      const receiverId = quote.customer.id === req.user!.id ? quote.artisan.id : quote.customer.id;

      const message = await this.messageService.sendQuoteDiscussionMessage(
        req.user!.id,
        receiverId,
        quoteId,
        content,
      );

      ApiResponse.created(res, message, 'Quote discussion message sent successfully');
    } catch (error) {
      next(error);
    }
  }
}
