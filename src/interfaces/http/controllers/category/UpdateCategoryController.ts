import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICategoryService } from '../../../../application/services/product/CategoryService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

export class UpdateCategoryController extends BaseController {
  private categoryService: ICategoryService;

  constructor() {
    super();
    this.categoryService = container.resolve<ICategoryService>('categoryService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      // Ensure user is an admin
      if (req.user!.role !== 'ADMIN') {
        throw AppError.forbidden('Only admins can update categories');
      }

      const { id } = req.params;
      const category = await this.categoryService.updateCategory(id, req.body);

      ApiResponse.success(res, category, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
