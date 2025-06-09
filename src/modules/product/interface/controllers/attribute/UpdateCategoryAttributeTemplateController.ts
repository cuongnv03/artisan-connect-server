import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductAttributeService } from '../../../services/ProductAttributeService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class UpdateCategoryAttributeTemplateController extends BaseController {
  private attributeService: IProductAttributeService;

  constructor() {
    super();
    this.attributeService = container.resolve<IProductAttributeService>('productAttributeService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);
    this.validateRole(req, ['ADMIN']);

    const { templateId } = req.params;
    const template = await this.attributeService.updateCategoryAttributeTemplate(
      templateId,
      req.body,
    );

    ApiResponse.success(res, template, 'Category attribute template updated successfully');
  }
}
