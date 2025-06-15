import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { ICategoryService } from '../../../services/CategoryService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class CreateCategoryAttributeTemplateController extends BaseController {
  private categoryService: ICategoryService;

  constructor() {
    super();
    this.categoryService = container.resolve<ICategoryService>('categoryService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      if (req.user!.role !== 'ADMIN') {
        throw AppError.forbidden('Only admins can create category attribute templates');
      }

      const { categoryId } = req.params;
      const template = await this.categoryService.createCategoryAttributeTemplate(
        categoryId,
        req.body,
        req.user!.id,
      );

      ApiResponse.created(res, template, 'Category attribute template created successfully');
    } catch (error) {
      next(error);
    }
  }
}
