import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductAttributeService } from '../../../services/ProductAttributeService.interface';
import container from '../../../../../core/di/container';

export class GetProductVariantsController extends BaseController {
  private attributeService: IProductAttributeService;

  constructor() {
    super();
    this.attributeService = container.resolve<IProductAttributeService>('productAttributeService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { productId } = req.params;
    const variants = await this.attributeService.getProductVariants(productId);

    ApiResponse.success(res, variants, 'Product variants retrieved successfully');
  }
}
