import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../services/ProductService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class GetProductStatsController extends BaseController {
  private productService: IProductService;

  constructor() {
    super();
    this.productService = container.resolve<IProductService>('productService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    if (req.user!.role !== 'ARTISAN') {
      throw AppError.forbidden('Only artisans can view product statistics');
    }

    const stats = await this.productService.getProductStats(req.user!.id);

    ApiResponse.success(res, stats, 'Product statistics retrieved successfully');
  }
}
