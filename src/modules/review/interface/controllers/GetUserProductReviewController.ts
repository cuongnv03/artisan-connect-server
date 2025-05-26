import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IReviewService } from '../../services/ReviewService.interface';
import container from '../../../../core/di/container';

export class GetUserProductReviewController extends BaseController {
  private reviewService: IReviewService;

  constructor() {
    super();
    this.reviewService = container.resolve<IReviewService>('reviewService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const { productId } = req.params;
      const review = await this.reviewService.getReviewByUserAndProduct(req.user!.id, productId);

      if (!review) {
        res.status(404).json({
          success: false,
          error: 'REVIEW_NOT_FOUND',
          message: 'User has not reviewed this product',
        });
        return;
      }

      ApiResponse.success(res, review, 'User product review retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
