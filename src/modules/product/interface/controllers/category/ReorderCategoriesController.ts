import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { ICategoryService } from '../../../services/CategoryService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class ReorderCategoriesController extends BaseController {
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
        throw AppError.forbidden('Only admins can reorder categories');
      }

      const { categoryOrders } = req.body;
      const result = await this.categoryService.reorderCategories(categoryOrders);

      if (result) {
        ApiResponse.success(res, null, 'Categories reordered successfully');
      } else {
        throw AppError.internal('Failed to reorder categories');
      }
    } catch (error) {
      next(error);
    }
  }
}
