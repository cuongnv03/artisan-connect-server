import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../services/ProductService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';
import { Logger } from '../../../../../core/logging/Logger';

export class GetProductBySlugController extends BaseController {
  private productService: IProductService;
  private logger = Logger.getInstance();

  constructor() {
    super();
    this.productService = container.resolve<IProductService>('productService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const product = await this.productService.getProductBySlug(slug, req.user?.id);

      if (!product) {
        throw AppError.notFound('Product not found');
      }

      // Increment view count asynchronously
      this.productService.viewProduct(product.id, req.user?.id).catch((err) => {
        this.logger.error(`Failed to increment view count: ${err}`);
      });

      ApiResponse.success(res, product, 'Product retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
