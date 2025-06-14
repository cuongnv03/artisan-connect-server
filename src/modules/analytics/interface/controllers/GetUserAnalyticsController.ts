import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IAnalyticsService } from '../../services/AnalyticsService.interface';
import container from '../../../../core/di/container';

export class GetUserAnalyticsController extends BaseController {
  private analyticsService: IAnalyticsService;

  constructor() {
    super();
    this.analyticsService = container.resolve<IAnalyticsService>('analyticsService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const analytics = await this.analyticsService.getUserAnalytics(req.user!.id);

      ApiResponse.success(res, analytics, 'User analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
