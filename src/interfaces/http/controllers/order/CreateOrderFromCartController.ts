import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../../../application/services/order/OrderService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class CreateOrderFromCartController extends BaseController {
  private orderService: IOrderService;

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const order = await this.orderService.createOrderFromCart(req.user!.id, req.body);

      ApiResponse.created(res, order, 'Order created successfully');
    } catch (error) {
      next(error);
    }
  }
}
