import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import {
  Category,
  CategoryWithRelations,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryAttributeTemplate,
} from '../models/Category';

export interface ICategoryRepository extends BaseRepository<Category, string> {
  createCategory(data: CreateCategoryDto): Promise<Category>;
  updateCategory(id: string, data: UpdateCategoryDto): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;
  getAllCategories(): Promise<Category[]>;
  getCategoryTree(): Promise<CategoryWithRelations[]>;
  getCategoryBySlug(slug: string): Promise<CategoryWithRelations | null>;
  generateSlug(name: string): Promise<string>;
  getCategoryAttributeTemplates(categoryId: string): Promise<CategoryAttributeTemplate[]>;
  createCategoryAttributeTemplate(
    categoryId: string,
    data: Partial<CategoryAttributeTemplate>,
  ): Promise<CategoryAttributeTemplate>;
}
