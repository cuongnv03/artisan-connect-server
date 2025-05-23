import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { CustomOrderNegotiationService } from '../../../services/CustomOrderNegotiationService';
import container from '../../../../../core/di/container';

export class GetNegotiationHistoryController extends BaseController {
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

      const history = await this.customOrderService.getNegotiationHistory(
        negotiationId,
        req.user!.id,
      );

      ApiResponse.success(res, history, 'Negotiation history retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
