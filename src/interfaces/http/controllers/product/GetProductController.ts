import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../../application/services/product/ProductService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

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

      ApiResponse.success(res, product, 'Product retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
