import { Category } from './Category';
import { ProductStatus } from './ProductEnums';

/**
 * Product entity
 */
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
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Product with seller information
 */
export interface ProductWithSeller extends Product {
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    artisanProfile?: {
      shopName: string;
    } | null;
  };
}

/**
 * Product with category information
 */
export interface ProductWithDetails extends ProductWithSeller {
  categories: Category[];
  priceHistory: PriceHistory[];
}

/**
 * Product dimensions
 */
export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}

/**
 * Price history entry
 */
export interface PriceHistory {
  id: string;
  productId: string;
  price: number;
  changeNote?: string | null;
  changedBy: string;
  createdAt: Date;
}

/**
 * Product creation attributes
 */
export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number | null;
  quantity: number;
  categories?: string[];
  status: ProductStatus;
  images: string[];
  tags?: string[];
  attributes?: Record<string, any>;
  isCustomizable: boolean;
  sku?: string;
  weight?: number;
  dimensions?: ProductDimensions;
}

/**
 * Product update attributes
 */
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
  attributes?: Record<string, any>;
  isCustomizable?: boolean;
  sku?: string;
  weight?: number;
  dimensions?: ProductDimensions;
}

/**
 * Price update dto
 */
export interface PriceUpdateDto {
  price: number;
  changeNote?: string;
}

/**
 * Product query options
 */
export interface ProductQueryOptions {
  page?: number;
  limit?: number;
  sellerId?: string;
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus[];
  isCustomizable?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
