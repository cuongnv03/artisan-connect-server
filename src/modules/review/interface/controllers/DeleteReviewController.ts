import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IReviewService } from '../../application/ReviewService.interface';
import container from '../../../../core/di/container';

export class DeleteReviewController extends BaseController {
  private reviewService: IReviewService;

  constructor() {
    super();
    this.reviewService = container.resolve<IReviewService>('reviewService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { id } = req.params;
      await this.reviewService.deleteReview(id, req.user!.id);

      ApiResponse.success(res, null, 'Review deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
