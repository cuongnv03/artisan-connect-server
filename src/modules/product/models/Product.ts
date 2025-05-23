import { ProductStatus } from './ProductEnums';

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
  categories?: string[];
  images: string[];
  tags?: string[];
  isCustomizable?: boolean;
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
