import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../../services/OrderService.interface';
import container from '../../../../../core/di/container';

export class DeleteOrderController extends BaseController {
  private orderService: IOrderService;

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);
    this.validateRole(req, ['ADMIN']);

    const { id } = req.params;

    await this.orderService.deleteOrder(id, req.user!.id);

    ApiResponse.success(res, null, 'Order deleted successfully');
  }
}
