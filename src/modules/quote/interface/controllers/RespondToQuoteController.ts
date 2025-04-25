import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IQuoteService } from '../../services/QuoteService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class RespondToQuoteController extends BaseController {
  private quoteService: IQuoteService;

  constructor() {
    super();
    this.quoteService = container.resolve<IQuoteService>('quoteService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      // Ensure user is an artisan
      if (req.user!.role !== 'ARTISAN') {
        throw AppError.forbidden('Only artisans can respond to quote requests');
      }

      const { id } = req.params;
      const updatedQuote = await this.quoteService.respondToQuoteRequest(
        id,
        req.user!.id,
        req.body,
      );

      ApiResponse.success(res, updatedQuote, 'Response to quote request successful');
    } catch (error) {
      next(error);
    }
  }
}
