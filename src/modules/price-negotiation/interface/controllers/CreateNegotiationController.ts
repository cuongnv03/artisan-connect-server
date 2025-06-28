import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPriceNegotiationService } from '../../services/PriceNegotiationService.interface';
import container from '../../../../core/di/container';

export class CreateNegotiationController extends BaseController {
  private negotiationService: IPriceNegotiationService;

  constructor() {
    super();
    this.negotiationService =
      container.resolve<IPriceNegotiationService>('priceNegotiationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const result = await this.negotiationService.createNegotiation(req.user!.id, req.body);

    if (result.isNew) {
      ApiResponse.created(res, result.negotiation, 'Price negotiation created successfully');
    } else {
      // FIXED: Return the negotiation data, not null
      ApiResponse.success(
        res,
        result.negotiation, // Important: return actual data
        'You already have an active price negotiation for this product',
      );
    }
  }
}
