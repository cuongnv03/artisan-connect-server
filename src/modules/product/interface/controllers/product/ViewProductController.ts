import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../services/ProductService.interface';
import container from '../../../../../core/di/container';

export class ViewProductController extends BaseController {
  private productService: IProductService;

  constructor() {
    super();
    this.productService = container.resolve<IProductService>('productService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Increment view count asynchronously (no need to wait)
      this.productService.viewProduct(id).catch(() => {
        // Ignore view count errors
      });

      ApiResponse.success(res, { success: true }, 'Product view recorded');
    } catch (error) {
      // Don't fail the request if view tracking fails
      ApiResponse.success(res, { success: true }, 'Product view recorded');
    }
  }
}
