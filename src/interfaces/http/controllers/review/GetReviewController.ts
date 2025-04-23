import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IReviewService } from '../../../../application/services/review/ReviewService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class GetReviewController extends BaseController {
  private reviewService: IReviewService;

  constructor() {
    super();
    this.reviewService = container.resolve<IReviewService>('reviewService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const review = await this.reviewService.getReviewById(id);

      if (!review) {
        throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
      }

      ApiResponse.success(res, review, 'Review retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
