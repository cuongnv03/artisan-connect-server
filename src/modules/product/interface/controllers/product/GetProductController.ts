import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../services/ProductService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class GetProductController extends BaseController {
  private productService: IProductService;

  constructor() {
    super();
    this.productService = container.resolve<IProductService>('productService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    const product = await this.productService.getProductById(id);

    if (!product) {
      throw AppError.notFound('Product not found');
    }

    // Increment view count asynchronously
    this.productService.viewProduct(id).catch(() => {
      // Ignore view count errors
    });

    ApiResponse.success(res, product, 'Product retrieved successfully');
  }
}
