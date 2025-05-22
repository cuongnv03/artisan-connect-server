import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../services/ProductService.interface';
import container from '../../../../../core/di/container';

export class GetRelatedProductsController extends BaseController {
  private productService: IProductService;

  constructor() {
    super();
    this.productService = container.resolve<IProductService>('productService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;

      const products = await this.productService.getRelatedProducts(id, limit);

      ApiResponse.success(res, products, 'Related products retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
