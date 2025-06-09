import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductAttributeService } from '../../../services/ProductAttributeService.interface';
import container from '../../../../../core/di/container';

export class DeleteCategoryAttributeTemplateController extends BaseController {
  private attributeService: IProductAttributeService;

  constructor() {
    super();
    this.attributeService = container.resolve<IProductAttributeService>('productAttributeService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);
    this.validateRole(req, ['ADMIN']);

    const { templateId } = req.params;
    await this.attributeService.deleteCategoryAttributeTemplate(templateId);

    ApiResponse.success(res, null, 'Category attribute template deleted successfully');
  }
}
