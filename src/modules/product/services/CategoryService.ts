import { ICategoryService } from './CategoryService.interface';
import {
  Category,
  CategoryWithChildren,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../models/Category';
import { ICategoryRepository } from '../repositories/CategoryRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export class CategoryService implements ICategoryService {
  private categoryRepository: ICategoryRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.categoryRepository = container.resolve<ICategoryRepository>('categoryRepository');
  }

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    try {
      this.validateCategoryData(data);

      const category = await this.categoryRepository.createCategory(data);

      this.logger.info(`Category created: ${category.id} - ${category.name}`);

      return category;
    } catch (error) {
      this.logger.error(`Error creating category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create category', 500, 'SERVICE_ERROR');
    }
  }

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    try {
      if (data.name) {
        this.validateCategoryName(data.name);
      }

      const category = await this.categoryRepository.updateCategory(id, data);

      this.logger.info(`Category updated: ${id} - ${category.name}`);

      return category;
    } catch (error) {
      this.logger.error(`Error updating category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update category', 500, 'SERVICE_ERROR');
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const result = await this.categoryRepository.deleteCategory(id);

      if (result) {
        this.logger.info(`Category deleted: ${id}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error deleting category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete category', 500, 'SERVICE_ERROR');
    }
  }

  async getAllCategories(): Promise<Category[]> {
    try {
      return await this.categoryRepository.getAllCategories();
    } catch (error) {
      this.logger.error(`Error getting all categories: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get categories', 500, 'SERVICE_ERROR');
    }
  }

  async getCategoryTree(): Promise<CategoryWithChildren[]> {
    try {
      return await this.categoryRepository.getCategoryTree();
    } catch (error) {
      this.logger.error(`Error getting category tree: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get category tree', 500, 'SERVICE_ERROR');
    }
  }

  async getCategoryById(id: string): Promise<Category | null> {
    try {
      return await this.categoryRepository.findById(id);
    } catch (error) {
      this.logger.error(`Error getting category by ID: ${error}`);
      return null;
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      return await this.categoryRepository.getCategoryBySlug(slug);
    } catch (error) {
      this.logger.error(`Error getting category by slug: ${error}`);
      return null;
    }
  }

  private validateCategoryData(data: CreateCategoryDto): void {
    this.validateCategoryName(data.name);

    if (data.description && data.description.length > 500) {
      throw new AppError(
        'Category description cannot exceed 500 characters',
        400,
        'INVALID_DESCRIPTION',
      );
    }
  }

  private validateCategoryName(name: string): void {
    if (!name || name.trim().length < 2) {
      throw new AppError(
        'Category name must be at least 2 characters',
        400,
        'INVALID_CATEGORY_NAME',
      );
    }

    if (name.length > 100) {
      throw new AppError(
        'Category name cannot exceed 100 characters',
        400,
        'INVALID_CATEGORY_NAME',
      );
    }
  }
}
