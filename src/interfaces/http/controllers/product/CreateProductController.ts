import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../../application/services/product/ProductService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class CreateProductController extends BaseController {
  private productService: IProductService;

  constructor() {
    super();
    this.productService = container.resolve<IProductService>('productService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      // Ensure user is an artisan
      if (req.user!.role !== 'ARTISAN') {
        throw AppError.forbidden('Only artisans can create products');
      }

      const product = await this.productService.createProduct(req.user!.id, req.body);

      ApiResponse.created(res, product, 'Product created successfully');
    } catch (error) {
      next(error);
    }
  }
}
