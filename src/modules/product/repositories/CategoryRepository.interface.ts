import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { Product } from '../models/Product';
import {
  Category,
  CategoryWithChildren,
  CategoryWithParent,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryOptions,
} from '../models/Category';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface ICategoryRepository extends BaseRepository<Category, string> {
  /**
   * Find category by ID with options
   */
  findByIdWithOptions(
    id: string,
    options?: CategoryQueryOptions,
  ): Promise<Category | CategoryWithChildren | CategoryWithParent | null>;

  /**
   * Create category
   */
  createCategory(data: CreateCategoryDto): Promise<Category>;

  /**
   * Update category
   */
  updateCategory(id: string, data: UpdateCategoryDto): Promise<Category>;

  /**
   * Delete category
   */
  deleteCategory(id: string): Promise<boolean>;

  /**
   * Get all categories
   */
  getAllCategories(options?: CategoryQueryOptions): Promise<Category[]>;

  /**
   * Get category tree
   */
  getCategoryTree(): Promise<CategoryWithChildren[]>;

  /**
   * Get products by category
   */
  getProductsByCategory(
    categoryId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Product>>;

  /**
   * Get all child category IDs
   */
  getAllChildCategoryIds(categoryId: string): Promise<string[]>;

  /**
   * Validate category hierarchy (prevent cycles)
   */
  validateCategoryHierarchy(categoryId: string, newParentId: string): Promise<boolean>;
}
