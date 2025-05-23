import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { CustomOrderNegotiationService } from '../../../services/CustomOrderNegotiationService';
import container from '../../../../../core/di/container';

export class GetActiveNegotiationsController extends BaseController {
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

      const role = req.user!.role === 'ARTISAN' ? 'artisan' : 'customer';

      const negotiations = await this.customOrderService.getActiveNegotiations(req.user!.id, role);

      ApiResponse.success(res, negotiations, 'Active negotiations retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
