import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../../../application/services/order/OrderService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class CancelOrderController extends BaseController {
  private orderService: IOrderService;

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { id } = req.params;
      const { note } = req.body;

      const cancelledOrder = await this.orderService.cancelOrder(id, req.user!.id, note);

      ApiResponse.success(res, cancelledOrder, 'Order cancelled successfully');
    } catch (error) {
      next(error);
    }
  }
}
