import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../services/OrderService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class GetOrderController extends BaseController {
  private orderService: IOrderService;

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const { id } = req.params;

    // Validate access
    const hasAccess = await this.orderService.validateOrderAccess(id, req.user!.id, 'VIEW');
    if (!hasAccess) {
      throw AppError.forbidden('You do not have permission to view this order');
    }

    const order = await this.orderService.getOrderById(id);

    if (!order) {
      throw AppError.notFound('Order not found');
    }

    ApiResponse.success(res, order, 'Order retrieved successfully');
  }
}
