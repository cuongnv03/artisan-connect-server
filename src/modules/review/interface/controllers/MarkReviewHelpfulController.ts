import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IReviewService } from '../../services/ReviewService.interface';
import container from '../../../../core/di/container';

export class MarkReviewHelpfulController extends BaseController {
  private reviewService: IReviewService;

  constructor() {
    super();
    this.reviewService = container.resolve<IReviewService>('reviewService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { id } = req.params;
      const review = await this.reviewService.markReviewHelpful(id, req.user!.id, req.body);

      ApiResponse.success(
        res,
        review,
        req.body.helpful ? 'Review marked as helpful' : 'Review unmarked as helpful',
      );
    } catch (error) {
      next(error);
    }
  }
}
