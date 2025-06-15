import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPriceNegotiationService } from '../../services/PriceNegotiationService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class RespondToNegotiationController extends BaseController {
  private negotiationService: IPriceNegotiationService;

  constructor() {
    super();
    this.negotiationService =
      container.resolve<IPriceNegotiationService>('priceNegotiationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    if (req.user!.role !== 'ARTISAN') {
      throw AppError.forbidden('Only artisans can respond to price negotiations');
    }

    const { id } = req.params;
    const negotiation = await this.negotiationService.respondToNegotiation(
      id,
      req.user!.id,
      req.body,
    );

    const actionMessages = {
      ACCEPT: 'Price negotiation accepted successfully',
      REJECT: 'Price negotiation rejected successfully',
      COUNTER: 'Counter offer sent successfully',
    };

    const message =
      actionMessages[req.body.action as keyof typeof actionMessages] ||
      'Price negotiation response sent successfully';

    ApiResponse.success(res, negotiation, message);
  }
}
