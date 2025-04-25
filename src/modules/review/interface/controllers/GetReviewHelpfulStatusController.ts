import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IReviewService } from '../../services/ReviewService.interface';
import container from '../../../../core/di/container';

export class GetReviewHelpfulStatusController extends BaseController {
  private reviewService: IReviewService;

  constructor() {
    super();
    this.reviewService = container.resolve<IReviewService>('reviewService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { id } = req.params;
      const hasMarked = await this.reviewService.hasMarkedReviewHelpful(id, req.user!.id);

      ApiResponse.success(res, { hasMarked }, 'Review helpful status retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
