import { ProductStatus } from './ProductEnums';
import {
  CreateProductAttributeDto,
  CreateProductVariantDto,
  ProductAttribute,
  ProductVariant,
} from './ProductAttribute';

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  status: ProductStatus;
  images: string[];
  tags: string[];
  isCustomizable: boolean;
  viewCount: number;
  salesCount: number;
  specifications?: Record<string, any>;
  customFields?: Record<string, any>;
  hasVariants: boolean;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithSeller extends Product {
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl?: string;
    artisanProfile?: {
      shopName: string;
      isVerified: boolean;
    };
  };
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface ProductWithDetails extends ProductWithSeller {
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  specifications?: Record<string, any>;
  customFields?: Record<string, any>;
}

export interface PriceHistory {
  id: string;
  productId: string;
  price: number;
  changeNote?: string;
  createdAt: Date;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  categories: string[];
  images: string[];
  tags?: string[];
  isCustomizable?: boolean;
  specifications?: Record<string, any>;
  customFields?: Record<string, any>;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  attributes?: CreateProductAttributeDto[];
  variants?: CreateProductVariantDto[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  discountPrice?: number;
  quantity?: number;
  categories?: string[];
  images?: string[];
  tags?: string[];
  isCustomizable?: boolean;
  status?: ProductStatus;
  specifications?: Record<string, any>;
  customFields?: Record<string, any>;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  attributes?: CreateProductAttributeDto[];
  variants?: CreateProductVariantDto[];
}

export interface ProductQueryOptions {
  page?: number;
  limit?: number;
  sellerId?: string;
  categoryId?: string;
  search?: string;
  status?: ProductStatus | ProductStatus[];
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

export interface ProductStats {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  totalViews: number;
  totalSales: number;
}
