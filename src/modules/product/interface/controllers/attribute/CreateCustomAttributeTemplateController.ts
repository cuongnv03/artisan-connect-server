import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { IProductAttributeService } from '../../../services/ProductAttributeService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class CreateCustomAttributeTemplateController extends BaseController {
  private attributeService: IProductAttributeService;

  constructor() {
    super();
    this.attributeService = container.resolve<IProductAttributeService>('productAttributeService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    if (req.user!.role !== 'ARTISAN') {
      throw AppError.forbidden('Only artisans can create custom attribute templates');
    }

    const template = await this.attributeService.createCustomAttributeTemplate(
      req.user!.id,
      req.body,
    );

    ApiResponse.created(res, template, 'Custom attribute template created successfully');
  }
}
