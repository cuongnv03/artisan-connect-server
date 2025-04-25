import {
  Category,
  CategoryWithChildren,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryOptions,
} from '../models/Category';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface ICategoryService {
  /**
   * Create a new category
   */
  createCategory(data: CreateCategoryDto): Promise<Category>;

  /**
   * Update a category
   */
  updateCategory(id: string, data: UpdateCategoryDto): Promise<Category>;

  /**
   * Delete a category
   */
  deleteCategory(id: string): Promise<boolean>;

  /**
   * Get category by ID
   */
  getCategoryById(id: string, options?: CategoryQueryOptions): Promise<Category | null>;

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
  ): Promise<PaginatedResult<any>>;
}
