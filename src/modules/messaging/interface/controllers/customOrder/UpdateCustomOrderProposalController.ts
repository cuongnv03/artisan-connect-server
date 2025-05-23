import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { CustomOrderNegotiationService } from '../../../services/CustomOrderNegotiationService';
import container from '../../../../../core/di/container';

export class UpdateCustomOrderProposalController extends BaseController {
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
      const { updates } = req.body;

      const result = await this.customOrderService.updateProposal(
        req.user!.id,
        negotiationId,
        updates,
      );

      ApiResponse.success(res, result, 'Custom order proposal updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
