import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../application/ProductService.interface';
import { IReviewService } from '../../../../review/application/ReviewService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class GetProductController extends BaseController {
  private productService: IProductService;

  constructor() {
    super();
    this.productService = container.resolve<IProductService>('productService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const product = await this.productService.getProductById(id);

      if (!product) {
        throw AppError.notFound('Product not found');
      }

      // Add user's review if authenticated
      let userReview = null;
      if (req.user) {
        const reviewService = container.resolve<IReviewService>('reviewService');
        userReview = await reviewService.getReviewByUserAndProduct(req.user.id, id);
      }

      ApiResponse.success(res, { ...product, userReview }, 'Product retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
