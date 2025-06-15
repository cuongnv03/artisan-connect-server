import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICustomOrderService } from '../../services/CustomOrderService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class RespondToCustomOrderController extends BaseController {
  private customOrderService: ICustomOrderService;

  constructor() {
    super();
    this.customOrderService = container.resolve<ICustomOrderService>('customOrderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    if (req.user!.role !== 'ARTISAN') {
      throw AppError.forbidden('Only artisans can respond to custom order requests');
    }

    const { id } = req.params;
    const customOrder = await this.customOrderService.respondToCustomOrder(
      id,
      req.user!.id,
      req.body,
    );

    const actionMessages = {
      ACCEPT: 'Custom order request accepted successfully',
      REJECT: 'Custom order request rejected successfully',
      COUNTER_OFFER: 'Counter offer sent successfully',
    };

    const message = actionMessages[req.body.action] || 'Custom order response sent successfully';

    ApiResponse.success(res, customOrder, message);
  }
}
