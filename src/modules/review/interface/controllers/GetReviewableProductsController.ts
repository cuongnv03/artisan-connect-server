import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IReviewService } from '../../application/ReviewService.interface';
import { IProductService } from '../../../product/application/ProductService.interface';
import container from '../../../../core/di/container';

export class GetReviewableProductsController extends BaseController {
  private reviewService: IReviewService;
  private productService: IProductService;

  constructor() {
    super();
    this.reviewService = container.resolve<IReviewService>('reviewService');
    this.productService = container.resolve<IProductService>('productService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      const reviewableProducts = await this.reviewService.getReviewableProducts(req.user!.id);

      // Fetch product details for each reviewable product
      const productsWithDetails = [];
      for (const item of reviewableProducts) {
        const product = await this.productService.getProductById(item.productId);
        if (product) {
          productsWithDetails.push({
            ...item,
            product: {
              id: product.id,
              name: product.name,
              images: product.images,
            },
          });
        }
      }

      ApiResponse.success(res, productsWithDetails, 'Reviewable products retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
