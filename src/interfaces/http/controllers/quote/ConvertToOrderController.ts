import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IQuoteService } from '../../../../application/services/quote/QuoteService.interface';
import { IOrderService } from '../../../../application/services/order/OrderService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class ConvertToOrderController extends BaseController {
  private quoteService: IQuoteService;
  private orderService: IOrderService;

  constructor() {
    super();
    this.quoteService = container.resolve<IQuoteService>('quoteService');
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { id } = req.params;

      // Verify the quote exists and is in ACCEPTED status
      const quote = await this.quoteService.getQuoteRequestById(id);

      if (!quote) {
        throw AppError.notFound('Quote request not found');
      }

      if (quote.customerId !== req.user!.id) {
        throw AppError.forbidden('You do not have permission to convert this quote');
      }

      if (quote.status !== 'ACCEPTED') {
        throw AppError.badRequest('Only accepted quotes can be converted to orders');
      }

      // Now create order from quote
      const order = await this.orderService.createOrderFromQuote(req.user!.id, {
        quoteRequestId: id,
        addressId: req.body.addressId,
        paymentMethod: req.body.paymentMethod,
        notes: req.body.notes,
      });

      ApiResponse.success(res, order, 'Quote successfully converted to order');
    } catch (error) {
      next(error);
    }
  }
}
