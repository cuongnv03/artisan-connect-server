import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICategoryService } from '../../../../application/services/product/CategoryService.interface';
import container from '../../../../di/container';

export class GetCategoryTreeController extends BaseController {
  private categoryService: ICategoryService;

  constructor() {
    super();
    this.categoryService = container.resolve<ICategoryService>('categoryService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryTree = await this.categoryService.getCategoryTree();

      ApiResponse.success(res, categoryTree, 'Category tree retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
