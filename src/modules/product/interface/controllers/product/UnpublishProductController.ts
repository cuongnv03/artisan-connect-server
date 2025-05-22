import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../services/ProductService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class UnpublishProductController extends BaseController {
  private productService: IProductService;

  constructor() {
    super();
    this.productService = container.resolve<IProductService>('productService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      if (req.user!.role !== 'ARTISAN') {
        throw AppError.forbidden('Only artisans can unpublish products');
      }

      const { id } = req.params;
      const product = await this.productService.unpublishProduct(id, req.user!.id);

      ApiResponse.success(res, product, 'Product unpublished successfully');
    } catch (error) {
      next(error);
    }
  }
}
