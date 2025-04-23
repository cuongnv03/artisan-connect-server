import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IQuoteService } from '../../../../application/services/quote/QuoteService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class CreateQuoteRequestController extends BaseController {
  private quoteService: IQuoteService;

  constructor() {
    super();
    this.quoteService = container.resolve<IQuoteService>('quoteService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const quoteRequest = await this.quoteService.createQuoteRequest(req.user!.id, req.body);

      ApiResponse.created(res, quoteRequest, 'Quote request created successfully');
    } catch (error) {
      next(error);
    }
  }
}
