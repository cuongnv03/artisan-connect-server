import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductAttributeService } from '../../../services/ProductAttributeService.interface';
import container from '../../../../../core/di/container';

export class GetProductAttributesController extends BaseController {
  private attributeService: IProductAttributeService;

  constructor() {
    super();
    this.attributeService = container.resolve<IProductAttributeService>('productAttributeService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { productId } = req.params;
    const attributes = await this.attributeService.getProductAttributes(productId);

    ApiResponse.success(res, attributes, 'Product attributes retrieved successfully');
  }
}
