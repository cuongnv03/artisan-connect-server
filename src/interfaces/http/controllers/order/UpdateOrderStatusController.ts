import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../../../application/services/order/OrderService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class UpdateOrderStatusController extends BaseController {
  private orderService: IOrderService;

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { id } = req.params;
      const updatedOrder = await this.orderService.updateOrderStatus(id, req.body, req.user!.id);

      ApiResponse.success(res, updatedOrder, 'Order status updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
