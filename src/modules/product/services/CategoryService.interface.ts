import {
  Category,
  CategoryWithChildren,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../models/Category';

export interface ICategoryService {
  createCategory(data: CreateCategoryDto): Promise<Category>;
  updateCategory(id: string, data: UpdateCategoryDto): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;
  getAllCategories(): Promise<Category[]>;
  getCategoryTree(): Promise<CategoryWithChildren[]>;
  getCategoryById(id: string): Promise<Category | null>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
}
