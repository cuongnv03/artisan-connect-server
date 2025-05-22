import { ProductStatus } from './ProductEnums';

export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: string; // 'cm', 'inch', etc.
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  quantity: number;
  sku?: string | null;
  weight?: number | null;
  dimensions?: ProductDimensions | null;
  status: ProductStatus;
  images: string[];
  tags: string[];
  attributes?: Record<string, any> | null;
  isCustomizable: boolean;
  avgRating?: number | null;
  reviewCount: number;
  viewCount: number;
  salesCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface ProductWithSeller extends Product {
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl?: string | null;
    artisanProfile?: {
      shopName: string;
      isVerified: boolean;
    } | null;
  };
}

export interface ProductWithDetails extends ProductWithSeller {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  priceHistory: PriceHistory[];
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface PriceHistory {
  id: string;
  productId: string;
  price: number;
  changeNote?: string | null;
  changedBy: string;
  createdAt: Date;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number | null;
  quantity: number;
  categories?: string[];
  status?: ProductStatus;
  images: string[];
  tags?: string[];
  attributes?: Record<string, any>;
  isCustomizable?: boolean;
  sku?: string;
  weight?: number;
  dimensions?: ProductDimensions;
}

export interface UpdateProductDto {
  name?: string;
  description?: string | null;
  price?: number;
  discountPrice?: number | null;
  quantity?: number;
  categories?: string[];
  status?: ProductStatus;
  images?: string[];
  tags?: string[];
  attributes?: Record<string, any> | null;
  isCustomizable?: boolean;
  sku?: string | null;
  weight?: number | null;
  dimensions?: ProductDimensions | null;
}

export interface PriceUpdateDto {
  price: number;
  changeNote?: string;
}

export interface ProductQueryOptions {
  page?: number;
  limit?: number;
  sellerId?: string;
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus | ProductStatus[];
  isCustomizable?: boolean;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  inStock?: boolean;
}

export interface ProductPaginationResult {
  data: ProductWithSeller[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductStockUpdate {
  productId: string;
  quantity: number;
  operation: 'increment' | 'decrement' | 'set';
}

export interface ProductInventoryCheck {
  productId: string;
  requestedQuantity: number;
  availableQuantity: number;
  inStock: boolean;
}
