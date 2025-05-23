import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { ICategoryService } from '../../../services/CategoryService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class UpdateCategoryController extends BaseController {
  private categoryService: ICategoryService;

  constructor() {
    super();
    this.categoryService = container.resolve<ICategoryService>('categoryService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    if (req.user!.role !== 'ADMIN') {
      throw AppError.forbidden('Only admins can update categories');
    }

    const { id } = req.params;
    const category = await this.categoryService.updateCategory(id, req.body);

    ApiResponse.success(res, category, 'Category updated successfully');
  }
}
