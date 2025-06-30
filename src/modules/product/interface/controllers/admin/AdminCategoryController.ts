import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../../shared/utils/ApiResponse';
import { ICategoryService } from '../../../services/CategoryService.interface';
import { AppError } from '../../../../../core/errors/AppError';
import container from '../../../../../core/di/container';

export class AdminCategoryController extends BaseController {
  private categoryService: ICategoryService;

  constructor() {
    super();
    this.categoryService = container.resolve<ICategoryService>('categoryService');
  }

  // Get all categories
  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.validateAuth(req);

      if (req.user!.role !== 'ADMIN') {
        throw AppError.forbidden('Only admins can access this resource');
      }

      const categories = await this.categoryService.getAllCategories();
      const categoryTree = await this.categoryService.getCategoryTree();

      ApiResponse.success(res, { categories, categoryTree }, 'Categories retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // Create category
  public createCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      this.validateAuth(req);

      if (req.user!.role !== 'ADMIN') {
        throw AppError.forbidden('Only admins can create categories');
      }

      const category = await this.categoryService.createCategory(req.body);

      ApiResponse.created(res, category, 'Category created successfully');
    } catch (error) {
      next(error);
    }
  };

  // Update category
  public updateCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      this.validateAuth(req);

      if (req.user!.role !== 'ADMIN') {
        throw AppError.forbidden('Only admins can update categories');
      }

      const { id } = req.params;
      const category = await this.categoryService.updateCategory(id, req.body);

      ApiResponse.success(res, category, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  };

  // Delete category
  public deleteCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      this.validateAuth(req);

      if (req.user!.role !== 'ADMIN') {
        throw AppError.forbidden('Only admins can delete categories');
      }

      const { id } = req.params;
      await this.categoryService.deleteCategory(id);

      ApiResponse.success(res, null, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // === ATTRIBUTE TEMPLATE METHODS ===

  // Get category attribute templates
  public getAttributeTemplates = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      this.validateAuth(req);

      if (req.user!.role !== 'ADMIN') {
        throw AppError.forbidden('Only admins can access this resource');
      }

      const { categoryId } = req.params;
      const templates = await this.categoryService.getCategoryAttributeTemplates(categoryId);

      ApiResponse.success(res, templates, 'Attribute templates retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  // Create attribute template
  public createAttributeTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      this.validateAuth(req);

      if (req.user!.role !== 'ADMIN') {
        throw AppError.forbidden('Only admins can create attribute templates');
      }

      const { categoryId } = req.params;
      const template = await this.categoryService.createCategoryAttributeTemplate(
        categoryId,
        req.body,
        req.user!.id,
      );

      ApiResponse.created(res, template, 'Attribute template created successfully');
    } catch (error) {
      next(error);
    }
  };

  // Delete attribute template
  public deleteAttributeTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      this.validateAuth(req);

      if (req.user!.role !== 'ADMIN') {
        throw AppError.forbidden('Only admins can delete attribute templates');
      }

      const { templateId } = req.params;
      // Implement delete method in service
      // await this.categoryService.deleteAttributeTemplate(templateId);

      ApiResponse.success(res, null, 'Attribute template deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
