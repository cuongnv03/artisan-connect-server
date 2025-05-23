import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPostAnalyticsService } from '../../services/PostAnalyticsService.interface';
import container from '../../../../core/di/container';

export class GetUserAnalyticsSummaryController extends BaseController {
  private postAnalyticsService: IPostAnalyticsService;

  constructor() {
    super();
    this.postAnalyticsService = container.resolve<IPostAnalyticsService>('postAnalyticsService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      // Users can only view their own analytics summary
      const userId = req.user!.id;

      const summary = await this.postAnalyticsService.getUserAnalyticsSummary(userId);

      ApiResponse.success(res, summary, 'Analytics summary retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
