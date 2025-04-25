import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IReviewService } from '../../services/ReviewService.interface';
import container from '../../../../core/di/container';

export class GetUserReviewsController extends BaseController {
  private reviewService: IReviewService;

  constructor() {
    super();
    this.reviewService = container.resolve<IReviewService>('reviewService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const reviews = await this.reviewService.getReviews({
        userId: req.user!.id,
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      ApiResponse.success(res, reviews, 'User reviews retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
