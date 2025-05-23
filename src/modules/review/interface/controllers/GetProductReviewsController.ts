import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IReviewService } from '../../services/ReviewService.interface';
import container from '../../../../core/di/container';

export class GetProductReviewsController extends BaseController {
  private reviewService: IReviewService;

  constructor() {
    super();
    this.reviewService = container.resolve<IReviewService>('reviewService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
      const sortBy = (req.query.sortBy as 'createdAt' | 'rating' | 'updatedAt') || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      const reviews = await this.reviewService.getReviews({
        productId,
        rating,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      // Get review statistics
      const stats = await this.reviewService.getProductReviewStatistics(productId);

      ApiResponse.success(
        res,
        { reviews, statistics: stats },
        'Product reviews retrieved successfully',
      );
    } catch (error) {
      next(error);
    }
  }
}
