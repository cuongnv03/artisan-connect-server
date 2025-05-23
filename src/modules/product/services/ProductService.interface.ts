import {
  Product,
  ProductWithSeller,
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
  createProduct(sellerId: string, data: CreateProductDto): Promise<ProductWithSeller>;
  updateProduct(id: string, sellerId: string, data: UpdateProductDto): Promise<ProductWithSeller>;
  deleteProduct(id: string, sellerId: string): Promise<boolean>;
  getProductById(id: string): Promise<ProductWithSeller | null>;
  getProductBySlug(slug: string): Promise<ProductWithSeller | null>;

  // Queries
  getProducts(options?: ProductQueryOptions): Promise<ProductPaginationResult>;
  getMyProducts(
    sellerId: string,
    options?: Omit<ProductQueryOptions, 'sellerId'>,
  ): Promise<ProductPaginationResult>;
  searchProducts(query: string, options?: ProductQueryOptions): Promise<ProductPaginationResult>;

  // Price management (tính năng độc đáo)
  updatePrice(
    id: string,
    sellerId: string,
    price: number,
    note?: string,
  ): Promise<ProductWithSeller>;
  getPriceHistory(
    productId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<PriceHistory>>;

  // Status management
  publishProduct(id: string, sellerId: string): Promise<ProductWithSeller>;
  unpublishProduct(id: string, sellerId: string): Promise<ProductWithSeller>;

  // Analytics
  viewProduct(id: string): Promise<void>;
  getProductStats(sellerId: string): Promise<ProductStats>;
}
