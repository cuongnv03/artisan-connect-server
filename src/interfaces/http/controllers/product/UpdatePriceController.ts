import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../../application/services/product/ProductService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class UpdatePriceController extends BaseController {
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
        throw AppError.forbidden('Only artisans can update product prices');
      }

      const { id } = req.params;
      const product = await this.productService.updatePrice(id, req.user!.id, req.body);

      ApiResponse.success(res, product, 'Product price updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
