import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IQuoteService } from '../../services/QuoteService.interface';
import container from '../../../../core/di/container';

export class CancelQuoteController extends BaseController {
  private quoteService: IQuoteService;

  constructor() {
    super();
    this.quoteService = container.resolve<IQuoteService>('quoteService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const { id } = req.params;
    const { reason } = req.body;

    const quote = await this.quoteService.cancelQuoteRequest(id, req.user!.id, reason);

    ApiResponse.success(res, quote, 'Quote request cancelled successfully');
  }
}
