import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../services/ProductService.interface';
import { ProductQueryOptions } from '../../../models/Product';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class GetMyProductsController extends BaseController {
  private productService: IProductService;

  constructor() {
    super();
    this.productService = container.resolve<IProductService>('productService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    if (req.user!.role !== 'ARTISAN') {
      throw AppError.forbidden('Only artisans can view their products');
    }

    const options: Omit<ProductQueryOptions, 'sellerId'> = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      status: req.query.status ? [req.query.status as any] : undefined,
      search: req.query.search as string,
      categoryId: req.query.categoryId as string,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const products = await this.productService.getMyProducts(req.user!.id, options);

    ApiResponse.success(res, products, 'My products retrieved successfully');
  }
}
