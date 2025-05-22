import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
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
import { ProductPaginationResult } from '../models/Product';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface ICategoryRepository extends BaseRepository<Category, string> {
  // Category CRUD with options
  findByIdWithOptions(
    id: string,
    options?: CategoryQueryOptions,
  ): Promise<Category | CategoryWithChildren | CategoryWithParent | null>;
  findBySlugWithOptions(
    slug: string,
    options?: CategoryQueryOptions,
  ): Promise<Category | CategoryWithChildren | CategoryWithParent | null>;
  createCategory(data: CreateCategoryDto): Promise<Category>;
  updateCategory(id: string, data: UpdateCategoryDto): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;

  // Category queries
  getAllCategories(options?: CategoryQueryOptions): Promise<Category[]>;
  getCategoryTree(): Promise<CategoryTreeNode[]>;
  getRootCategories(options?: CategoryQueryOptions): Promise<CategoryWithChildren[]>;
  getChildCategories(parentId: string, options?: CategoryQueryOptions): Promise<Category[]>;
  getCategoryPath(categoryId: string): Promise<Category[]>;

  // Category-Product relationships
  getProductsByCategory(categoryId: string, options?: any): Promise<CategoryProductsResult>;
  getCategoriesWithProductCount(): Promise<CategoryWithChildren[]>;
  getAllChildCategoryIds(categoryId: string): Promise<string[]>;

  // Validation and utilities
  validateCategoryHierarchy(categoryId: string, newParentId: string): Promise<boolean>;
  isCategoryNameUnique(name: string, excludeId?: string): Promise<boolean>;
  generateSlug(name: string): Promise<string>;
  updateCategoryLevel(categoryId: string): Promise<void>;

  // Category management
  reorderCategories(categoryOrders: Array<{ id: string; sortOrder: number }>): Promise<boolean>;
  moveCategory(categoryId: string, newParentId: string | null): Promise<Category>;
  mergeCategoriesProducts(fromCategoryId: string, toCategoryId: string): Promise<boolean>;
}
