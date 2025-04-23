import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICategoryService } from '../../../../application/services/product/CategoryService.interface';
import { CategoryQueryOptions } from '../../../../domain/product/entities/Category';
import container from '../../../../di/container';

export class GetAllCategoriesController extends BaseController {
  private categoryService: ICategoryService;

  constructor() {
    super();
    this.categoryService = container.resolve<ICategoryService>('categoryService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options: CategoryQueryOptions = {
        includeParent: req.query.includeParent === 'true',
        includeStat: req.query.includeStat === 'true',
      };

      const categories = await this.categoryService.getAllCategories(options);

      ApiResponse.success(res, categories, 'Categories retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
