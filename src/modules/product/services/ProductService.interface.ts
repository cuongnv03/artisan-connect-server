import {
  Product,
  ProductWithDetails,
  CreateProductDto,
  UpdateProductDto,
  ProductQueryOptions,
  ProductPaginationResult,
  PriceHistory,
  ProductStats,
} from '../models/Product';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IProductService {
  // Core CRUD
  createProduct(sellerId: string, data: CreateProductDto): Promise<ProductWithDetails>;
  updateProduct(id: string, sellerId: string, data: UpdateProductDto): Promise<ProductWithDetails>;
  deleteProduct(id: string, sellerId: string): Promise<boolean>;
  getProductById(id: string, userId?: string): Promise<ProductWithDetails | null>;
  getProductBySlug(slug: string, userId?: string): Promise<ProductWithDetails | null>;

  // Queries
  getProducts(options?: ProductQueryOptions): Promise<ProductPaginationResult>;
  getMyProducts(
    sellerId: string,
    options?: Omit<ProductQueryOptions, 'sellerId'>,
  ): Promise<ProductPaginationResult>;
  searchProducts(query: string, options?: ProductQueryOptions): Promise<ProductPaginationResult>;

  // Price management
  updatePrice(
    id: string,
    sellerId: string,
    price: number,
    note?: string,
  ): Promise<ProductWithDetails>;
  getPriceHistory(
    productId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<PriceHistory>>;

  // Status management
  publishProduct(id: string, sellerId: string): Promise<ProductWithDetails>;
  unpublishProduct(id: string, sellerId: string): Promise<ProductWithDetails>;

  // Analytics
  viewProduct(id: string): Promise<void>;
  getProductStats(sellerId: string): Promise<ProductStats>;
}
