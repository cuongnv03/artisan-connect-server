import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICategoryService } from '../../../../application/services/product/CategoryService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import { CategoryQueryOptions } from '../../../../domain/product/entities/Category';
import container from '../../../../di/container';

export class GetCategoryController extends BaseController {
  private categoryService: ICategoryService;

  constructor() {
    super();
    this.categoryService = container.resolve<ICategoryService>('categoryService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const options: CategoryQueryOptions = {
        includeParent: req.query.includeParent === 'true',
        includeChildren: req.query.includeChildren === 'true',
        includeStat: req.query.includeStat === 'true',
      };

      const category = await this.categoryService.getCategoryById(id, options);

      if (!category) {
        throw AppError.notFound('Category not found');
      }

      ApiResponse.success(res, category, 'Category retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
