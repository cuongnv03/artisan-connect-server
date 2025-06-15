import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPriceNegotiationService } from '../../services/PriceNegotiationService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class GetNegotiationController extends BaseController {
  private negotiationService: IPriceNegotiationService;

  constructor() {
    super();
    this.negotiationService =
      container.resolve<IPriceNegotiationService>('priceNegotiationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const { id } = req.params;

    // Validate access
    const hasAccess = await this.negotiationService.validateNegotiationAccess(id, req.user!.id);
    if (!hasAccess) {
      throw AppError.forbidden('You do not have permission to view this price negotiation');
    }

    const negotiation = await this.negotiationService.getNegotiationById(id);

    if (!negotiation) {
      throw AppError.notFound('Price negotiation not found');
    }

    ApiResponse.success(res, negotiation, 'Price negotiation retrieved successfully');
  }
}
