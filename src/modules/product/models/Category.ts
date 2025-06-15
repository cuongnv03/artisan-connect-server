export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  level: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryWithRelations extends Category {
  parent?: Category | null;
  children?: CategoryWithRelations[];
  productCount?: number;
  attributeTemplates?: CategoryAttributeTemplate[];
}

export interface CategoryAttributeTemplate {
  id: string;
  categoryId: string;
  name: string;
  key: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT' | 'BOOLEAN' | 'DATE' | 'URL' | 'EMAIL';
  isRequired: boolean;
  isVariant: boolean;
  options?: string[] | null;
  unit?: string | null;
  sortOrder: number;
  description?: string | null;
  isCustom: boolean;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateCategoryAttributeTemplateDto {
  name: string;
  key: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT' | 'BOOLEAN' | 'DATE' | 'URL' | 'EMAIL';
  isRequired?: boolean;
  isVariant?: boolean;
  options?: string[];
  unit?: string;
  sortOrder?: number;
  description?: string;
}

export interface UpdateCategoryAttributeTemplateDto
  extends Partial<CreateCategoryAttributeTemplateDto> {}

export interface CategoryQueryOptions {
  includeParent?: boolean;
  includeChildren?: boolean;
  includeProductCount?: boolean;
  includeAttributeTemplates?: boolean;
}
