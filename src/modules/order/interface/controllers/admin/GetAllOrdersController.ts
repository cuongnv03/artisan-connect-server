import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../../services/OrderService.interface';
import container from '../../../../../core/di/container';

export class GetAllOrdersController extends BaseController {
  private orderService: IOrderService;

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);
    this.validateRole(req, ['ADMIN']);

    const options = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      userId: req.query.userId as string,
      sellerId: req.query.sellerId as string,
      status: req.query.status as any,
      paymentStatus: req.query.paymentStatus as any,
      deliveryStatus: req.query.deliveryStatus as any,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const orders = await this.orderService.getAllOrdersForAdmin(options);

    ApiResponse.success(res, orders, 'All orders retrieved successfully for admin');
  }
}
