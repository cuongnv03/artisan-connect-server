import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../../services/OrderService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class GetDisputeController extends BaseController {
  private orderService: IOrderService;

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const { id } = req.params;
    const dispute = await this.orderService.getDisputeById(id);

    if (!dispute) {
      throw AppError.notFound('Dispute not found');
    }

    // Validate access - only complainant, seller, or admin can view
    const hasAccess = await this.orderService.validateDisputeAccess(id, req.user!.id);
    if (!hasAccess) {
      throw AppError.forbidden('You do not have permission to view this dispute');
    }

    ApiResponse.success(res, dispute, 'Dispute retrieved successfully');
  }
}
