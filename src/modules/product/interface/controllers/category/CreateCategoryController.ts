import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { ICategoryService } from '../../../application/CategoryService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class CreateCategoryController extends BaseController {
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
        throw AppError.forbidden('Only admins can create categories');
      }

      const category = await this.categoryService.createCategory(req.body);

      ApiResponse.created(res, category, 'Category created successfully');
    } catch (error) {
      next(error);
    }
  }
}
