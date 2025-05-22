import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { ICategoryService } from '../../../services/CategoryService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class MoveCategoryController extends BaseController {
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
        throw AppError.forbidden('Only admins can move categories');
      }

      const { id } = req.params;
      const { newParentId } = req.body;

      const category = await this.categoryService.moveCategory(id, newParentId);

      ApiResponse.success(res, category, 'Category moved successfully');
    } catch (error) {
      next(error);
    }
  }
}
