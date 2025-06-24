import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPriceNegotiationService } from '../../services/PriceNegotiationService.interface';
import container from '../../../../core/di/container';
import { AppError } from '../../../../core/errors/AppError';

export class CheckExistingNegotiationController extends BaseController {
  private negotiationService: IPriceNegotiationService;

  constructor() {
    super();
    this.negotiationService =
      container.resolve<IPriceNegotiationService>('priceNegotiationService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const { productId } = req.params;
    const { variantId } = req.query; // NEW: Get variantId from query
    const customerId = req.user!.id;

    // Only customers can check for their own negotiations
    if (req.user!.role !== 'CUSTOMER') {
      throw new AppError('Only customers can check their own negotiations', 403, 'FORBIDDEN');
    }

    const result = await this.negotiationService.checkExistingNegotiation(
      customerId,
      productId,
      variantId as string, // NEW
    );

    ApiResponse.success(res, result, 'Existing negotiation check completed');
  }
}
