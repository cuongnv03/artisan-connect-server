import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../../services/OrderService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class GetReturnController extends BaseController {
  private orderService: IOrderService;

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const { id } = req.params;
    const returnRequest = await this.orderService.getReturnById(id);

    if (!returnRequest) {
      throw AppError.notFound('Return request not found');
    }

    // Validate access - only requester, seller, or admin can view
    const hasAccess = await this.orderService.validateReturnAccess(id, req.user!.id);
    if (!hasAccess) {
      throw AppError.forbidden('You do not have permission to view this return request');
    }

    ApiResponse.success(res, returnRequest, 'Return request retrieved successfully');
  }
}
