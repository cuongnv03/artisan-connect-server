import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPostAnalyticsService } from '../../services/PostAnalyticsService.interface';
import container from '../../../../core/di/container';

export class TrackConversionEventController extends BaseController {
  private postAnalyticsService: IPostAnalyticsService;

  constructor() {
    super();
    this.postAnalyticsService = container.resolve<IPostAnalyticsService>('postAnalyticsService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.body;

      // Track asynchronously - don't wait for completion
      this.postAnalyticsService.trackConversionEvent(postId).catch((err) => {
        console.error('Error tracking conversion event:', err);
      });

      ApiResponse.success(res, { tracked: true }, 'Conversion event tracked successfully');
    } catch (error) {
      next(error);
    }
  }
}
