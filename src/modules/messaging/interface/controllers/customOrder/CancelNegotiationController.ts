import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { CustomOrderNegotiationService } from '../../../services/CustomOrderNegotiationService';
import container from '../../../../../core/di/container';

export class CancelNegotiationController extends BaseController {
  private customOrderService: CustomOrderNegotiationService;

  constructor() {
    super();
    this.customOrderService = container.resolve<CustomOrderNegotiationService>(
      'customOrderNegotiationService',
    );
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { negotiationId } = req.params;
      const { reason } = req.body;

      const result = await this.customOrderService.cancelNegotiation(
        negotiationId,
        req.user!.id,
        reason,
      );

      ApiResponse.success(res, { cancelled: result }, 'Negotiation cancelled successfully');
    } catch (error) {
      next(error);
    }
  }
}
