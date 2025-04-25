import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IQuoteService } from '../../services/QuoteService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class GetMyQuoteRequestsController extends BaseController {
  private quoteService: IQuoteService;

  constructor() {
    super();
    this.quoteService = container.resolve<IQuoteService>('quoteService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      let quotes;

      // Check if user is a customer or artisan
      if (req.user!.role === 'CUSTOMER') {
        quotes = await this.quoteService.getCustomerQuoteRequests(req.user!.id, page, limit);
      } else if (req.user!.role === 'ARTISAN') {
        quotes = await this.quoteService.getArtisanQuoteRequests(req.user!.id, page, limit);
      } else {
        throw AppError.forbidden('Unauthorized role for quote requests');
      }

      ApiResponse.success(res, quotes, 'Quote requests retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
