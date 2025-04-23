import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IReviewService } from '../../../../application/services/review/ReviewService.interface';
import container from '../../../../di/container';

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
