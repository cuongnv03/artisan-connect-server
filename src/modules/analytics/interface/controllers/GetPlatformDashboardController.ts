import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IAnalyticsService } from '../../services/AnalyticsService.interface';
import container from '../../../../core/di/container';

export class GetPlatformDashboardController extends BaseController {
  private analyticsService: IAnalyticsService;

  constructor() {
    super();
    this.analyticsService = container.resolve<IAnalyticsService>('analyticsService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateRole(req, ['ADMIN']);

      const period = (req.query.period as string) || '30d';

      const dashboard = await this.analyticsService.getPlatformDashboard(period);

      ApiResponse.success(res, dashboard, 'Platform dashboard retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
