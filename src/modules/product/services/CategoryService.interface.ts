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

export interface ICategoryService {
  // Category CRUD
  createCategory(data: CreateCategoryDto): Promise<Category>;
  updateCategory(id: string, data: UpdateCategoryDto): Promise<Category>;
  getCategoryById(id: string, options?: CategoryQueryOptions): Promise<Category | null>;
  getCategoryBySlug(slug: string, options?: CategoryQueryOptions): Promise<Category | null>;
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

  // Category management
  reorderCategories(categoryOrders: Array<{ id: string; sortOrder: number }>): Promise<boolean>;
  moveCategory(categoryId: string, newParentId: string | null): Promise<Category>;
  mergeCategoriesProducts(fromCategoryId: string, toCategoryId: string): Promise<boolean>;

  // Validation
  checkCategoryName(name: string, excludeId?: string): Promise<boolean>;
}
