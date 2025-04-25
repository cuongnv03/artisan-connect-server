import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IReviewService } from '../../application/ReviewService.interface';
import container from '../../../../core/di/container';

export class GetProductReviewStatisticsController extends BaseController {
  private reviewService: IReviewService;

  constructor() {
    super();
    this.reviewService = container.resolve<IReviewService>('reviewService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const stats = await this.reviewService.getProductReviewStatistics(productId);

      ApiResponse.success(res, stats, 'Product review statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
