import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import {
  Category,
  CategoryWithChildren,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../models/Category';

export interface ICategoryRepository extends BaseRepository<Category, string> {
  createCategory(data: CreateCategoryDto): Promise<Category>;
  updateCategory(id: string, data: UpdateCategoryDto): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;
  getAllCategories(): Promise<Category[]>;
  getCategoryTree(): Promise<CategoryWithChildren[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  generateSlug(name: string): Promise<string>;
  getCategoryAttributeTemplates(categoryId: string): Promise<any[]>;
  createCategoryAttributeTemplate(categoryId: string, data: any): Promise<any>;
}
