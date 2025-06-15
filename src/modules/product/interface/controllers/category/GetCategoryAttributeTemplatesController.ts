import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { ICategoryService } from '../../../services/CategoryService.interface';
import container from '../../../../../core/di/container';

export class GetCategoryAttributeTemplatesController extends BaseController {
  private categoryService: ICategoryService;

  constructor() {
    super();
    this.categoryService = container.resolve<ICategoryService>('categoryService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;

      const templates = await this.categoryService.getCategoryAttributeTemplates(categoryId);

      ApiResponse.success(res, templates, 'Category attribute templates retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
