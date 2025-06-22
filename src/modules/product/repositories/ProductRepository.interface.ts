import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
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

export interface IProductRepository extends BaseRepository<Product, string> {
  // Core CRUD
  createProduct(sellerId: string, data: CreateProductDto): Promise<ProductWithDetails>;
  updateProduct(id: string, sellerId: string, data: UpdateProductDto): Promise<ProductWithDetails>;
  deleteProduct(id: string, sellerId: string): Promise<boolean>;
  getProductById(id: string, userId?: string): Promise<ProductWithDetails | null>;
  getProductBySlug(slug: string, userId?: string): Promise<ProductWithDetails | null>;

  // Queries
  getProducts(options: ProductQueryOptions): Promise<ProductPaginationResult>;
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
  incrementViewCount(id: string): Promise<void>;
  getProductStats(sellerId: string): Promise<ProductStats>;

  // Utilities
  generateSlug(name: string, sellerId: string): Promise<string>;
  generateSku(name: string, sellerId: string): Promise<string>;
  generateVariantSku(productId: string, attributes: Record<string, any>): Promise<string>;
  isProductOwner(productId: string, sellerId: string): Promise<boolean>;
}
