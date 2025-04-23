/**
 * Category entity
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  level: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Category with children
 */
export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

/**
 * Category with parent
 */
export interface CategoryWithParent extends Category {
  parent?: Category | null;
}

/**
 * Category creation attributes
 */
export interface CreateCategoryDto {
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
}

/**
 * Category update attributes
 */
export interface UpdateCategoryDto {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
}

/**
 * Category query options
 */
export interface CategoryQueryOptions {
  includeStat?: boolean;
  includeChildren?: boolean;
  includeParent?: boolean;
}
