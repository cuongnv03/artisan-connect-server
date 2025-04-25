import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../application/ProductService.interface';
import container from '../../../../../core/di/container';

export class GetPriceHistoryController extends BaseController {
  private productService: IProductService;

  constructor() {
    super();
    this.productService = container.resolve<IProductService>('productService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const priceHistory = await this.productService.getPriceHistory(id, page, limit);

      ApiResponse.success(res, priceHistory, 'Price history retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
