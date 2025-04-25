import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../application/ProductService.interface';
import { ProductQueryOptions } from '../../../domain/entities/Product';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class GetMyProductsController extends BaseController {
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
        throw AppError.forbidden('Only artisans can view their products');
      }

      const options: ProductQueryOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sellerId: req.user!.id,
        status: req.query.status
          ? Array.isArray(req.query.status)
            ? (req.query.status as any[])
            : [req.query.status as string]
          : undefined,
        search: req.query.search as string,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const products = await this.productService.getProducts(options);

      ApiResponse.success(res, products, 'My products retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
