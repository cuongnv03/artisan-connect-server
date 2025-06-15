import { ICategoryService } from './CategoryService.interface';
import {
  Category,
  CategoryWithRelations,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryAttributeTemplate,
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
      throw AppError.internal('Failed to create category', 'SERVICE_ERROR');
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
      throw AppError.internal('Failed to update category', 'SERVICE_ERROR');
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
      throw AppError.internal('Failed to delete category', 'SERVICE_ERROR');
    }
  }

  async getAllCategories(): Promise<Category[]> {
    try {
      return await this.categoryRepository.getAllCategories();
    } catch (error) {
      this.logger.error(`Error getting all categories: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get categories', 'SERVICE_ERROR');
    }
  }

  async getCategoryTree(): Promise<CategoryWithRelations[]> {
    try {
      return await this.categoryRepository.getCategoryTree();
    } catch (error) {
      this.logger.error(`Error getting category tree: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get category tree', 'SERVICE_ERROR');
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

  async getCategoryBySlug(slug: string): Promise<CategoryWithRelations | null> {
    try {
      return await this.categoryRepository.getCategoryBySlug(slug);
    } catch (error) {
      this.logger.error(`Error getting category by slug: ${error}`);
      return null;
    }
  }

  async getCategoryAttributeTemplates(categoryId: string): Promise<CategoryAttributeTemplate[]> {
    try {
      // Verify category exists
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        throw AppError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
      }

      return await this.categoryRepository.getCategoryAttributeTemplates(categoryId);
    } catch (error) {
      this.logger.error(`Error getting category attribute templates: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get category attribute templates', 'SERVICE_ERROR');
    }
  }

  async createCategoryAttributeTemplate(
    categoryId: string,
    data: Partial<CategoryAttributeTemplate>,
    createdBy: string,
  ): Promise<CategoryAttributeTemplate> {
    try {
      // Verify category exists
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        throw AppError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
      }

      // Validate template data
      this.validateAttributeTemplateData(data);

      // Add creator info
      const templateData = {
        ...data,
        createdBy,
        isCustom: true,
      };

      const template = await this.categoryRepository.createCategoryAttributeTemplate(
        categoryId,
        templateData,
      );

      this.logger.info(
        `Category attribute template created: ${template.id} for category ${categoryId}`,
      );

      return template;
    } catch (error) {
      this.logger.error(`Error creating category attribute template: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to create category attribute template', 'SERVICE_ERROR');
    }
  }

  private validateCategoryData(data: CreateCategoryDto): void {
    this.validateCategoryName(data.name);

    if (data.description && data.description.length > 500) {
      throw AppError.badRequest(
        'Category description cannot exceed 500 characters',
        'INVALID_DESCRIPTION',
      );
    }

    if (data.imageUrl && !this.isValidUrl(data.imageUrl)) {
      throw AppError.badRequest('Invalid image URL', 'INVALID_IMAGE_URL');
    }
  }

  private validateCategoryName(name: string): void {
    if (!name || name.trim().length < 2) {
      throw AppError.badRequest(
        'Category name must be at least 2 characters',
        'INVALID_CATEGORY_NAME',
      );
    }

    if (name.length > 100) {
      throw AppError.badRequest(
        'Category name cannot exceed 100 characters',
        'INVALID_CATEGORY_NAME',
      );
    }
  }

  private validateAttributeTemplateData(data: Partial<CategoryAttributeTemplate>): void {
    if (!data.name || data.name.trim().length < 2) {
      throw AppError.badRequest(
        'Attribute name must be at least 2 characters',
        'INVALID_ATTRIBUTE_NAME',
      );
    }

    if (!data.key || data.key.trim().length < 2) {
      throw AppError.badRequest(
        'Attribute key must be at least 2 characters',
        'INVALID_ATTRIBUTE_KEY',
      );
    }

    if (!data.type) {
      throw AppError.badRequest('Attribute type is required', 'MISSING_ATTRIBUTE_TYPE');
    }

    const validTypes = [
      'TEXT',
      'NUMBER',
      'SELECT',
      'MULTI_SELECT',
      'BOOLEAN',
      'DATE',
      'URL',
      'EMAIL',
    ];
    if (!validTypes.includes(data.type)) {
      throw AppError.badRequest('Invalid attribute type', 'INVALID_ATTRIBUTE_TYPE');
    }

    // Validate options for SELECT and MULTI_SELECT types
    if (['SELECT', 'MULTI_SELECT'].includes(data.type)) {
      if (!data.options || !Array.isArray(data.options) || data.options.length === 0) {
        throw AppError.badRequest(
          'Options are required for SELECT and MULTI_SELECT types',
          'MISSING_ATTRIBUTE_OPTIONS',
        );
      }
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
