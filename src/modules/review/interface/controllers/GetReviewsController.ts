import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IReviewService } from '../../services/ReviewService.interface';
import { ReviewFilterOptions } from '../../models/Review';
import container from '../../../../core/di/container';

export class GetReviewsController extends BaseController {
  private reviewService: IReviewService;

  constructor() {
    super();
    this.reviewService = container.resolve<IReviewService>('reviewService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options: ReviewFilterOptions = {
        productId: req.query.productId as string,
        userId: req.query.userId as string,
        rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
        sortBy: (req.query.sortBy as 'createdAt' | 'rating' | 'updatedAt') || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      };

      const reviews = await this.reviewService.getReviews(options);

      ApiResponse.success(res, reviews, 'Reviews retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
