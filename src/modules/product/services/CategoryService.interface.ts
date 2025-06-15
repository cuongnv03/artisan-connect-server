import {
  Category,
  CategoryWithRelations,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryAttributeTemplate,
} from '../models/Category';

export interface ICategoryService {
  createCategory(data: CreateCategoryDto): Promise<Category>;
  updateCategory(id: string, data: UpdateCategoryDto): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;
  getAllCategories(): Promise<Category[]>;
  getCategoryTree(): Promise<CategoryWithRelations[]>;
  getCategoryById(id: string): Promise<Category | null>;
  getCategoryBySlug(slug: string): Promise<CategoryWithRelations | null>;
  getCategoryAttributeTemplates(categoryId: string): Promise<CategoryAttributeTemplate[]>;
  createCategoryAttributeTemplate(
    categoryId: string,
    data: Partial<CategoryAttributeTemplate>,
    createdBy: string,
  ): Promise<CategoryAttributeTemplate>;
}
