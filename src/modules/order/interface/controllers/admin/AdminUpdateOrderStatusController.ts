import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../../services/OrderService.interface';
import container from '../../../../../core/di/container';

export class AdminUpdateOrderStatusController extends BaseController {
  private orderService: IOrderService;

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);
    this.validateRole(req, ['ADMIN']);

    const { id } = req.params;

    const updateData = {
      ...req.body,
      estimatedDelivery: req.body.estimatedDelivery
        ? new Date(req.body.estimatedDelivery)
        : undefined,
    };

    const order = await this.orderService.adminUpdateOrderStatus(id, updateData, req.user!.id);

    ApiResponse.success(res, order, 'Order status updated successfully by admin');
  }
}
