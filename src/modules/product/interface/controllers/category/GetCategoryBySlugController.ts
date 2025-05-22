import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { ICategoryService } from '../../../services/CategoryService.interface';
import { CategoryQueryOptions } from '../../../models/Category';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class GetCategoryBySlugController extends BaseController {
  private categoryService: ICategoryService;

  constructor() {
    super();
    this.categoryService = container.resolve<ICategoryService>('categoryService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const options: CategoryQueryOptions = {
        includeParent: req.query.includeParent === 'true',
        includeChildren: req.query.includeChildren === 'true',
        includeProductCount: req.query.includeProductCount === 'true',
      };

      const category = await this.categoryService.getCategoryBySlug(slug, options);

      if (!category) {
        throw AppError.notFound('Category not found');
      }

      ApiResponse.success(res, category, 'Category retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
