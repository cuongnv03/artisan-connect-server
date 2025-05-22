import { ICategoryService } from './CategoryService.interface';
import {
  Category,
  CategoryWithChildren,
  CategoryWithParent,
  CategoryTreeNode,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryOptions,
  CategoryProductsResult,
} from '../models/Category';
import { ICategoryRepository } from '../repositories/CategoryRepository.interface';
import { CloudinaryService } from '../../../core/infrastructure/storage/CloudinaryService';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export class CategoryService implements ICategoryService {
  private categoryRepository: ICategoryRepository;
  private cloudinaryService: CloudinaryService;
  private logger = Logger.getInstance();

  constructor() {
    this.categoryRepository = container.resolve<ICategoryRepository>('categoryRepository');
    this.cloudinaryService = container.resolve<CloudinaryService>('cloudinaryService');
  }

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    try {
      // Validate category data
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
      // Validate update data
      if (data.name) {
        this.validateCategoryName(data.name);
      }

      // Get current category for image handling
      const currentCategory = await this.categoryRepository.findById(id);
      if (!currentCategory) {
        throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }

      // Handle image replacement if needed
      if (data.imageUrl && currentCategory.imageUrl && data.imageUrl !== currentCategory.imageUrl) {
        await this.deleteOldImage(currentCategory.imageUrl);
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

  async getCategoryById(id: string, options?: CategoryQueryOptions): Promise<Category | null> {
    try {
      return (await this.categoryRepository.findByIdWithOptions(id, options)) as Category;
    } catch (error) {
      this.logger.error(`Error getting category by ID: ${error}`);
      return null;
    }
  }

  async getCategoryBySlug(slug: string, options?: CategoryQueryOptions): Promise<Category | null> {
    try {
      return (await this.categoryRepository.findBySlugWithOptions(slug, options)) as Category;
    } catch (error) {
      this.logger.error(`Error getting category by slug: ${error}`);
      return null;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      // Get category to delete its image after successful deletion
      const category = await this.categoryRepository.findById(id);
      if (!category) {
        throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }

      const result = await this.categoryRepository.deleteCategory(id);

      // Delete category image if exists
      if (result && category.imageUrl) {
        await this.deleteOldImage(category.imageUrl);
      }

      this.logger.info(`Category deleted: ${id} - ${category.name}`);

      return result;
    } catch (error) {
      this.logger.error(`Error deleting category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete category', 500, 'SERVICE_ERROR');
    }
  }

  async getAllCategories(options?: CategoryQueryOptions): Promise<Category[]> {
    try {
      return await this.categoryRepository.getAllCategories(options);
    } catch (error) {
      this.logger.error(`Error getting all categories: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get categories', 500, 'SERVICE_ERROR');
    }
  }

  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    try {
      return await this.categoryRepository.getCategoryTree();
    } catch (error) {
      this.logger.error(`Error getting category tree: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get category tree', 500, 'SERVICE_ERROR');
    }
  }

  async getRootCategories(options?: CategoryQueryOptions): Promise<CategoryWithChildren[]> {
    try {
      return await this.categoryRepository.getRootCategories(options);
    } catch (error) {
      this.logger.error(`Error getting root categories: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get root categories', 500, 'SERVICE_ERROR');
    }
  }

  async getChildCategories(parentId: string, options?: CategoryQueryOptions): Promise<Category[]> {
    try {
      return await this.categoryRepository.getChildCategories(parentId, options);
    } catch (error) {
      this.logger.error(`Error getting child categories: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get child categories', 500, 'SERVICE_ERROR');
    }
  }

  async getCategoryPath(categoryId: string): Promise<Category[]> {
    try {
      return await this.categoryRepository.getCategoryPath(categoryId);
    } catch (error) {
      this.logger.error(`Error getting category path: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get category path', 500, 'SERVICE_ERROR');
    }
  }

  async getProductsByCategory(categoryId: string, options?: any): Promise<CategoryProductsResult> {
    try {
      return await this.categoryRepository.getProductsByCategory(categoryId, options);
    } catch (error) {
      this.logger.error(`Error getting products by category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get products by category', 500, 'SERVICE_ERROR');
    }
  }

  async getCategoriesWithProductCount(): Promise<CategoryWithChildren[]> {
    try {
      return await this.categoryRepository.getCategoriesWithProductCount();
    } catch (error) {
      this.logger.error(`Error getting categories with product count: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get categories with product count', 500, 'SERVICE_ERROR');
    }
  }

  async reorderCategories(
    categoryOrders: Array<{ id: string; sortOrder: number }>,
  ): Promise<boolean> {
    try {
      const result = await this.categoryRepository.reorderCategories(categoryOrders);

      if (result) {
        this.logger.info(`Categories reordered: ${categoryOrders.length} categories`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error reordering categories: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to reorder categories', 500, 'SERVICE_ERROR');
    }
  }

  async moveCategory(categoryId: string, newParentId: string | null): Promise<Category> {
    try {
      const category = await this.categoryRepository.moveCategory(categoryId, newParentId);

      this.logger.info(`Category moved: ${categoryId} to parent ${newParentId || 'root'}`);

      return category;
    } catch (error) {
      this.logger.error(`Error moving category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to move category', 500, 'SERVICE_ERROR');
    }
  }

  async mergeCategoriesProducts(fromCategoryId: string, toCategoryId: string): Promise<boolean> {
    try {
      if (fromCategoryId === toCategoryId) {
        throw new AppError('Cannot merge category with itself', 400, 'INVALID_MERGE');
      }

      const result = await this.categoryRepository.mergeCategoriesProducts(
        fromCategoryId,
        toCategoryId,
      );

      if (result) {
        this.logger.info(
          `Categories merged: products from ${fromCategoryId} moved to ${toCategoryId}`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Error merging categories: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to merge categories', 500, 'SERVICE_ERROR');
    }
  }

  async checkCategoryName(name: string, excludeId?: string): Promise<boolean> {
    try {
      return await this.categoryRepository.isCategoryNameUnique(name, excludeId);
    } catch (error) {
      this.logger.error(`Error validating category name: ${error}`);
      return false;
    }
  }

  // Private helper methods
  private validateCategoryData(data: CreateCategoryDto): void {
    if (!data.name || data.name.trim().length < 2) {
      throw new AppError(
        'Category name must be at least 2 characters',
        400,
        'INVALID_CATEGORY_NAME',
      );
    }

    if (data.name.length > 100) {
      throw new AppError(
        'Category name cannot exceed 100 characters',
        400,
        'INVALID_CATEGORY_NAME',
      );
    }

    if (data.description && data.description.length > 500) {
      throw new AppError(
        'Category description cannot exceed 500 characters',
        400,
        'INVALID_DESCRIPTION',
      );
    }

    if (data.sortOrder !== undefined && data.sortOrder < 0) {
      throw new AppError('Sort order cannot be negative', 400, 'INVALID_SORT_ORDER');
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

  private async deleteOldImage(imageUrl: string): Promise<void> {
    try {
      if (imageUrl.includes('cloudinary')) {
        const publicId = this.extractPublicIdFromUrl(imageUrl);
        if (publicId) {
          await this.cloudinaryService.deleteFile(publicId);
          this.logger.info(`Deleted old category image: ${publicId}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error deleting old image: ${error}`);
      // Don't throw, just log the error
    }
  }

  private extractPublicIdFromUrl(url: string): string | null {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }

    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const afterUpload = parts[1];
    // Remove any transformation parameters
    const withoutParams = afterUpload.split('/').pop();
    if (!withoutParams) return null;

    // Remove file extension
    const publicId = withoutParams.split('.')[0];
    return publicId;
  }
}
