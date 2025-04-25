import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../application/OrderService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class GetOrderByNumberController extends BaseController {
  private orderService: IOrderService;

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { orderNumber } = req.params;
      const order = await this.orderService.getOrderByOrderNumber(orderNumber);

      if (!order) {
        throw AppError.notFound('Order not found');
      }

      // Check if user is involved in this order
      if (
        order.userId !== req.user!.id &&
        !order.items.some((item) => item.sellerId === req.user!.id) &&
        req.user!.role !== 'ADMIN'
      ) {
        throw AppError.forbidden('You do not have permission to view this order');
      }

      ApiResponse.success(res, order, 'Order retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
