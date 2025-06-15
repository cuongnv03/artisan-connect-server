import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICustomOrderService } from '../../services/CustomOrderService.interface';
import container from '../../../../core/di/container';

export class GetCustomOrderStatsController extends BaseController {
  private customOrderService: ICustomOrderService;

  constructor() {
    super();
    this.customOrderService = container.resolve<ICustomOrderService>('customOrderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    let stats;

    if (req.user!.role === 'ADMIN') {
      // Admin can get overall stats or specific user stats
      const userId = req.query.userId as string;
      const userRole = req.query.role as string;
      stats = await this.customOrderService.getCustomOrderStats(userId, userRole);
    } else {
      // Get user's own stats
      stats = await this.customOrderService.getCustomOrderStats(req.user!.id, req.user!.role);
    }

    ApiResponse.success(res, stats, 'Custom order statistics retrieved successfully');
  }
}
