import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../services/ProductService.interface';
import container from '../../../../../core/di/container';

export class GetFeaturedProductsController extends BaseController {
  private productService: IProductService;

  constructor() {
    super();
    this.productService = container.resolve<IProductService>('productService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const products = await this.productService.getFeaturedProducts(limit);

      ApiResponse.success(res, products, 'Featured products retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
