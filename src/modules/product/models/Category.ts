export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
  productCount?: number;
}

export interface CategoryQueryOptions {
  includeParent?: boolean;
  includeChildren?: boolean;
  includeProductCount?: boolean;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive?: boolean;
}
