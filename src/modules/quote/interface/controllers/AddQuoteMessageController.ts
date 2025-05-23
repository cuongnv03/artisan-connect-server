import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IQuoteService } from '../../services/QuoteService.interface';
import container from '../../../../core/di/container';

export class AddQuoteMessageController extends BaseController {
  private quoteService: IQuoteService;

  constructor() {
    super();
    this.quoteService = container.resolve<IQuoteService>('quoteService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const { id } = req.params;
    const { message } = req.body;

    const quote = await this.quoteService.addMessageToQuote(id, req.user!.id, message);

    ApiResponse.success(res, quote, 'Message added to quote successfully');
  }
}
