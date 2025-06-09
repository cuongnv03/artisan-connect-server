import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductAttributeService } from '../../../services/ProductAttributeService.interface';
import container from '../../../../../core/di/container';

export class GetCategoryAttributeTemplatesController extends BaseController {
  private attributeService: IProductAttributeService;

  constructor() {
    super();
    this.attributeService = container.resolve<IProductAttributeService>('productAttributeService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { categoryId } = req.params;
    const templates = await this.attributeService.getCategoryAttributeTemplates(categoryId);

    ApiResponse.success(res, templates, 'Category attribute templates retrieved successfully');
  }
}
