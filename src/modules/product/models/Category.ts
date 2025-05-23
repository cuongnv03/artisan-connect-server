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
