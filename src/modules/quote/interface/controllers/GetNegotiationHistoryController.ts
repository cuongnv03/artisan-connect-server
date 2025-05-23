import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IQuoteService } from '../../services/QuoteService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class GetNegotiationHistoryController extends BaseController {
  private quoteService: IQuoteService;

  constructor() {
    super();
    this.quoteService = container.resolve<IQuoteService>('quoteService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const { id } = req.params;

    // Validate access
    const hasAccess = await this.quoteService.validateQuoteAccess(id, req.user!.id);
    if (!hasAccess) {
      throw AppError.forbidden('You do not have permission to view this quote negotiation history');
    }

    const history = await this.quoteService.getNegotiationHistory(id);

    ApiResponse.success(res, history, 'Negotiation history retrieved successfully');
  }
}
