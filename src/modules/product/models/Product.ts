import { Decimal } from '@prisma/client/runtime/library';
import { ProductStatus } from './ProductEnums';

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  price: Decimal;
  discountPrice?: Decimal | null;
  quantity: number;
  minOrderQty: number;
  maxOrderQty?: number | null;
  sku?: string | null;
  barcode?: string | null;
  weight?: number | null;
  dimensions?: Record<string, any> | null;
  allowNegotiation: boolean;
  shippingInfo?: Record<string, any> | null;
  status: ProductStatus;
  tags: string[];
  images: string[];
  featuredImage?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  attributes?: Record<string, any> | null;
  specifications?: Record<string, any> | null;
  customFields?: Record<string, any> | null;
  hasVariants: boolean;
  viewCount: number;
  salesCount: number;
  avgRating?: number | null;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name?: string | null;
  price: number;
  discountPrice?: number | null;
  quantity: number;
  images: string[];
  weight?: number | null;
  dimensions?: Record<string, any> | null;
  attributes: Record<string, any>;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceHistory {
  id: string;
  productId: string;
  price: number;
  changeNote?: string | null;
  changedBy?: string | null;
  createdAt: Date;
}

export interface PostProductMention {
  id: string;
  postId: string;
  productId: string;
  contextText?: string | null;
  position?: number | null;
  post: {
    id: string;
    title: string;
    slug?: string | null;
    type: string;
    user: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
    };
  };
}

export interface ProductWithDetails extends Product {
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
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  variants?: ProductVariant[];
  priceHistory?: PriceHistory[];
  postMentions?: PostProductMention[];
  isWishlisted?: boolean; // For authenticated users
}

// DTOs
export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  minOrderQty?: number;
  maxOrderQty?: number;
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: Record<string, any>;
  allowNegotiation?: boolean;
  shippingInfo?: Record<string, any>;
  status?: ProductStatus;
  tags?: string[];
  images: string[];
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  attributes?: Record<string, any>;
  specifications?: Record<string, any>;
  customFields?: Record<string, any>;
  categoryIds: string[];
  variants?: CreateProductVariantDto[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  discountPrice?: number;
  quantity?: number;
  minOrderQty?: number;
  maxOrderQty?: number;
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: Record<string, any>;
  allowNegotiation?: boolean;
  shippingInfo?: Record<string, any>;
  status?: ProductStatus;
  tags?: string[];
  images?: string[];
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  attributes?: Record<string, any>;
  specifications?: Record<string, any>;
  customFields?: Record<string, any>;
  categoryIds?: string[];
}

export interface CreateProductVariantDto {
  name?: string;
  price?: number;
  discountPrice?: number;
  quantity: number;
  images?: string[];
  weight?: number;
  dimensions?: Record<string, any>;
  attributes: Record<string, any>;
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface ProductQueryOptions {
  page?: number;
  limit?: number;
  sellerId?: string;
  categoryIds?: string[];
  search?: string;
  status?: ProductStatus | ProductStatus[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  inStock?: boolean;
  priceRange?: { min?: number; max?: number };
  hasVariants?: boolean;
  userId?: string; // For wishlist checking
}

export interface ProductPaginationResult {
  data: ProductWithDetails[];
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
  outOfStockProducts: number;
  totalViews: number;
  totalSales: number;
  avgRating?: number;
}
