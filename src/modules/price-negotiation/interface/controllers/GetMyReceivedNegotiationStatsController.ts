import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPriceNegotiationService } from '../../services/PriceNegotiationService.interface';
import container from '../../../../core/di/container';
import { AppError } from '../../../../core/errors/AppError';

export class GetMyReceivedNegotiationStatsController extends BaseController {
  private negotiationService: IPriceNegotiationService;

  constructor() {
    super();
    this.negotiationService =
      container.resolve<IPriceNegotiationService>('priceNegotiationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    // Only artisans can view received negotiation stats
    if (req.user!.role !== 'ARTISAN') {
      throw new AppError(
        'Only artisans can view received negotiation statistics',
        403,
        'FORBIDDEN',
      );
    }

    const userId = req.user!.id;

    // Get stats for negotiations received by current user
    const stats = await this.negotiationService.getNegotiationStats(userId, 'received');

    ApiResponse.success(res, stats, 'Received negotiation statistics retrieved successfully');
  }
}
