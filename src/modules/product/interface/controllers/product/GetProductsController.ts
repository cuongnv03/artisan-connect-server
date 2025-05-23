import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../services/ProductService.interface';
import { ProductQueryOptions } from '../../../models/Product';
import container from '../../../../../core/di/container';

export class GetProductsController extends BaseController {
  private productService: IProductService;

  constructor() {
    super();
    this.productService = container.resolve<IProductService>('productService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    const options: ProductQueryOptions = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sellerId: req.query.sellerId as string,
      categoryId: req.query.categoryId as string,
      search: req.query.search as string,
      status: req.query.status ? [req.query.status as any] : undefined,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      inStock:
        req.query.inStock === 'true' ? true : req.query.inStock === 'false' ? false : undefined,
    };

    const products = await this.productService.getProducts(options);

    ApiResponse.success(res, products, 'Products retrieved successfully');
  }
}
