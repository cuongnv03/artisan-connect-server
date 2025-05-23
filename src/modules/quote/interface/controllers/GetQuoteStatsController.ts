import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IQuoteService } from '../../services/QuoteService.interface';
import container from '../../../../core/di/container';

export class GetQuoteStatsController extends BaseController {
  private quoteService: IQuoteService;

  constructor() {
    super();
    this.quoteService = container.resolve<IQuoteService>('quoteService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    let stats;

    if (req.user!.role === 'ADMIN') {
      // Admin can get overall stats or specific user stats
      const userId = req.query.userId as string;
      const userRole = req.query.userRole as string;
      stats = await this.quoteService.getQuoteStats(userId, userRole);
    } else {
      // Get user's own stats
      stats = await this.quoteService.getQuoteStats(req.user!.id, req.user!.role);
    }

    ApiResponse.success(res, stats, 'Quote statistics retrieved successfully');
  }
}
