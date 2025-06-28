import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPriceNegotiationService } from '../../services/PriceNegotiationService.interface';
import container from '../../../../core/di/container';

export class GetMySentNegotiationStatsController extends BaseController {
  private negotiationService: IPriceNegotiationService;

  constructor() {
    super();
    this.negotiationService =
      container.resolve<IPriceNegotiationService>('priceNegotiationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const userId = req.user!.id;

    // Get stats for negotiations sent by current user
    const stats = await this.negotiationService.getNegotiationStats(userId, 'sent');

    ApiResponse.success(res, stats, 'Sent negotiation statistics retrieved successfully');
  }
}
