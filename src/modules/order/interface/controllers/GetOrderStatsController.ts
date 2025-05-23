import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../services/OrderService.interface';
import container from '../../../../core/di/container';

export class GetOrderStatsController extends BaseController {
  private orderService: IOrderService;

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    let stats;

    if (req.user!.role === 'ARTISAN') {
      // Get seller stats
      stats = await this.orderService.getOrderStats(undefined, req.user!.id);
    } else if (req.user!.role === 'ADMIN') {
      // Admin can get overall stats or specific user/seller stats
      const userId = req.query.userId as string;
      const sellerId = req.query.sellerId as string;
      stats = await this.orderService.getOrderStats(userId, sellerId);
    } else {
      // Get customer stats
      stats = await this.orderService.getOrderStats(req.user!.id);
    }

    ApiResponse.success(res, stats, 'Order statistics retrieved successfully');
  }
}
