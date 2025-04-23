import { ICategoryService } from './CategoryService.interface';
import {
  Category,
  CategoryWithChildren,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryOptions,
} from '../../../domain/product/entities/Category';
import { ICategoryRepository } from '../../../domain/product/repositories/CategoryRepository.interface';
import { CloudinaryService } from '../../../infrastructure/storage/CloudinaryService';
import { AppError } from '../../../shared/errors/AppError';
import { Logger } from '../../../shared/utils/Logger';
import { PaginatedResult } from '../../../domain/common/PaginatedResult';
import container from '../../../di/container';

export class CategoryService implements ICategoryService {
  private categoryRepository: ICategoryRepository;
  private cloudinaryService: CloudinaryService;
  private logger = Logger.getInstance();

  constructor() {
    this.categoryRepository = container.resolve<ICategoryRepository>('categoryRepository');
    this.cloudinaryService = container.resolve<CloudinaryService>('cloudinaryService');
  }

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryDto): Promise<Category> {
    try {
      return await this.categoryRepository.createCategory(data);
    } catch (error) {
      this.logger.error(`Error creating category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create category', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    try {
      // Get current category to handle image deletion if needed
      const currentCategory = await this.categoryRepository.findById(id);

      if (!currentCategory) {
        throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }

      // Handle image replacement if needed
      if (
        data.imageUrl !== undefined &&
        currentCategory.imageUrl &&
        data.imageUrl !== currentCategory.imageUrl
      ) {
        await this.deleteOldImage(currentCategory.imageUrl);
      }

      return await this.categoryRepository.updateCategory(id, data);
    } catch (error) {
      this.logger.error(`Error updating category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update category', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Delete a category
   */
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

      return result;
    } catch (error) {
      this.logger.error(`Error deleting category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete category', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string, options?: CategoryQueryOptions): Promise<Category | null> {
    try {
      return await this.categoryRepository.findByIdWithOptions(id, options);
    } catch (error) {
      this.logger.error(`Error getting category: ${error}`);
      return null;
    }
  }

  /**
   * Get all categories
   */
  async getAllCategories(options?: CategoryQueryOptions): Promise<Category[]> {
    try {
      return await this.categoryRepository.getAllCategories(options);
    } catch (error) {
      this.logger.error(`Error getting all categories: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get categories', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get category tree
   */
  async getCategoryTree(): Promise<CategoryWithChildren[]> {
    try {
      return await this.categoryRepository.getCategoryTree();
    } catch (error) {
      this.logger.error(`Error getting category tree: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get category tree', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    categoryId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<any>> {
    try {
      return await this.categoryRepository.getProductsByCategory(categoryId, page, limit);
    } catch (error) {
      this.logger.error(`Error getting products by category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get products by category', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Helper to delete old image from Cloudinary
   */
  private async deleteOldImage(imageUrl: string): Promise<void> {
    try {
      if (imageUrl.includes('cloudinary')) {
        const publicId = this.extractPublicIdFromUrl(imageUrl);
        if (publicId) {
          await this.cloudinaryService.deleteFile(publicId);
        }
      }
    } catch (error) {
      this.logger.error(`Error deleting old image: ${error}`);
      // Don't throw, just log the error
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   */
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
