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

    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Get negotiation to check permissions
    const negotiation = await this.negotiationService.getNegotiationById(id);
    if (!negotiation) {
      throw AppError.notFound('Price negotiation not found');
    }

    // Check if user can respond
    const canRespond =
      (userRole === 'ARTISAN' && negotiation.artisan.id === userId) ||
      (negotiation.customer.id === userId && negotiation.status === 'COUNTER_OFFERED');

    if (!canRespond) {
      throw AppError.forbidden('You cannot respond to this price negotiation');
    }

    // Determine who is responding
    const respondingAs = negotiation.artisan.id === userId ? 'artisan' : 'customer';

    const result = await this.negotiationService.respondToNegotiation(
      id,
      userId,
      req.body,
      respondingAs,
    );

    const actionMessages = {
      ACCEPT: 'Price negotiation accepted successfully',
      REJECT: 'Price negotiation rejected successfully',
      COUNTER: 'Counter offer sent successfully',
    };

    const message =
      actionMessages[req.body.action as keyof typeof actionMessages] ||
      'Price negotiation response sent successfully';

    ApiResponse.success(res, result, message);
  }
}
