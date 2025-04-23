import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IQuoteService } from '../../../../application/services/quote/QuoteService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class AddQuoteMessageController extends BaseController {
  private quoteService: IQuoteService;

  constructor() {
    super();
    this.quoteService = container.resolve<IQuoteService>('quoteService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { id } = req.params;
      const message = await this.quoteService.addMessageToQuote(id, req.user!.id, req.body);

      ApiResponse.success(res, message, 'Message added successfully');
    } catch (error) {
      next(error);
    }
  }
}
