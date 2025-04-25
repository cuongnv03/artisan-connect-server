import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IQuoteService } from '../../services/QuoteService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class GetQuoteRequestController extends BaseController {
  private quoteService: IQuoteService;

  constructor() {
    super();
    this.quoteService = container.resolve<IQuoteService>('quoteService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { id } = req.params;
      const quoteRequest = await this.quoteService.getQuoteRequestById(id);

      if (!quoteRequest) {
        throw AppError.notFound('Quote request not found');
      }

      // Ensure user is part of this quote (either customer or artisan)
      if (quoteRequest.customerId !== req.user!.id && quoteRequest.artisanId !== req.user!.id) {
        throw AppError.forbidden('You do not have permission to view this quote request');
      }

      ApiResponse.success(res, quoteRequest, 'Quote request retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
