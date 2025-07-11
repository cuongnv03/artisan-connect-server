import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../services/OrderService.interface';
import { OrderQueryOptions } from '../../models/Order';
import container from '../../../../core/di/container';

export class GetMyOrdersController extends BaseController {
  private orderService: IOrderService;

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const options: Partial<OrderQueryOptions> = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      status: req.query.status as any,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    if (req.query.dateFrom) {
      options.dateFrom = new Date(req.query.dateFrom as string);
    }

    if (req.query.dateTo) {
      options.dateTo = new Date(req.query.dateTo as string);
    }

    const orders = await this.orderService.getMyOrders(req.user!.id, options);

    ApiResponse.success(res, orders, 'My orders retrieved successfully');
  }
}
