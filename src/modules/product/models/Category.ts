import { ProductPaginationResult } from './Product';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  level: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
  productCount?: number;
}

export interface CategoryWithParent extends Category {
  parent?: Category | null;
  productCount?: number;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  productCount: number;
  depth: number;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CategoryQueryOptions {
  includeChildren?: boolean;
  includeParent?: boolean;
  includeProductCount?: boolean;
  includeInactive?: boolean;
  level?: number;
  parentId?: string | null;
}

export interface CategoryProductsResult {
  category: CategoryWithParent;
  products: ProductPaginationResult;
}
