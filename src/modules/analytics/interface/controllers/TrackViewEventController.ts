import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IPostAnalyticsService } from '../../application/PostAnalyticsService.interface';
import { v4 as uuidv4 } from 'uuid';
import container from '../../../../core/di/container';

export class TrackViewEventController extends BaseController {
  private postAnalyticsService: IPostAnalyticsService;

  constructor() {
    super();
    this.postAnalyticsService = container.resolve<IPostAnalyticsService>('postAnalyticsService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId, sessionId = uuidv4(), referrer, timeSpent } = req.body;
      const userId = req.user?.id;

      // Track asynchronously - don't wait for completion
      this.postAnalyticsService
        .trackViewEvent({
          postId,
          userId,
          sessionId,
          referrer,
          timeSpent,
        })
        .catch((err) => {
          console.error('Error tracking view event:', err);
        });

      ApiResponse.success(res, { tracked: true }, 'View event tracked');
    } catch (error) {
      next(error);
    }
  }
}
