import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPriceNegotiationService } from '../../services/PriceNegotiationService.interface';
import container from '../../../../core/di/container';

export class GetNegotiationStatsController extends BaseController {
  private negotiationService: IPriceNegotiationService;

  constructor() {
    super();
    this.negotiationService =
      container.resolve<IPriceNegotiationService>('priceNegotiationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    let stats;

    if (req.user!.role === 'ADMIN') {
      // Admin can get overall stats or specific user stats
      const userId = req.query.userId as string;
      const userRole = req.query.userRole as string;
      stats = await this.negotiationService.getNegotiationStats(userId, userRole);
    } else {
      // Get user's own stats
      stats = await this.negotiationService.getNegotiationStats(req.user!.id, req.user!.role);
    }

    ApiResponse.success(res, stats, 'Price negotiation statistics retrieved successfully');
  }
}
