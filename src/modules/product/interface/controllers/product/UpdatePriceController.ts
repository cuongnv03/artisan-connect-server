import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductService } from '../../../services/ProductService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class UpdatePriceController extends BaseController {
  private productService: IProductService;

  constructor() {
    super();
    this.productService = container.resolve<IProductService>('productService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    if (req.user!.role !== 'ARTISAN') {
      throw AppError.forbidden('Only artisans can update product prices');
    }

    const { id } = req.params;
    const { price, note } = req.body;

    const product = await this.productService.updatePrice(id, req.user!.id, price, note);

    ApiResponse.success(res, product, 'Product price updated successfully');
  }
}
