import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IAnalyticsService } from '../../services/AnalyticsService.interface';
import { AppError } from '../../../../core/errors/AppError';
import container from '../../../../core/di/container';

export class GetArtisanDashboardController extends BaseController {
  private analyticsService: IAnalyticsService;

  constructor() {
    super();
    this.analyticsService = container.resolve<IAnalyticsService>('analyticsService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      // Verify user is artisan or admin
      if (req.user!.role !== 'ARTISAN' && req.user!.role !== 'ADMIN') {
        throw AppError.forbidden('Only artisans can access business analytics');
      }

      const artisanId = req.params.artisanId || req.user!.id;
      const period = (req.query.period as string) || '30d';

      // If not admin, only allow access to own analytics
      if (req.user!.role !== 'ADMIN' && artisanId !== req.user!.id) {
        throw AppError.forbidden('You can only access your own analytics');
      }

      const dashboard = await this.analyticsService.getArtisanDashboard(artisanId, period);

      ApiResponse.success(res, dashboard, 'Artisan dashboard retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
