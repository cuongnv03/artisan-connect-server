import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { ICategoryService } from '../../../../application/services/product/CategoryService.interface';
import { AppError } from '../../../../shared/errors/AppError';
import container from '../../../../di/container';

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
