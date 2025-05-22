import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import {
  Product,
  ProductWithSeller,
  ProductWithDetails,
  CreateProductDto,
  UpdateProductDto,
  PriceUpdateDto,
  ProductQueryOptions,
  ProductPaginationResult,
  PriceHistory,
  ProductStockUpdate,
  ProductInventoryCheck,
} from '../models/Product';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IProductRepository extends BaseRepository<Product, string> {
  // Product CRUD with details
  findByIdWithDetails(id: string, requestUserId?: string): Promise<ProductWithDetails | null>;
  findBySlugWithDetails(slug: string, requestUserId?: string): Promise<ProductWithDetails | null>;
  createProduct(sellerId: string, data: CreateProductDto): Promise<ProductWithDetails>;
  updateProduct(id: string, sellerId: string, data: UpdateProductDto): Promise<ProductWithDetails>;
  deleteProduct(id: string, sellerId: string): Promise<boolean>;

  // Product queries
  getProducts(
    options: ProductQueryOptions,
    requestUserId?: string,
  ): Promise<ProductPaginationResult>;
  getMyProducts(
    sellerId: string,
    options?: Omit<ProductQueryOptions, 'sellerId'>,
  ): Promise<ProductPaginationResult>;
  searchProducts(query: string, options?: ProductQueryOptions): Promise<ProductPaginationResult>;
  getProductsByCategory(
    categoryId: string,
    options?: ProductQueryOptions,
  ): Promise<ProductPaginationResult>;
  getFeaturedProducts(limit?: number): Promise<ProductWithSeller[]>;
  getRelatedProducts(productId: string, limit?: number): Promise<ProductWithSeller[]>;

  // Price management
  updatePrice(id: string, sellerId: string, data: PriceUpdateDto): Promise<ProductWithDetails>;
  getPriceHistory(
    productId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<PriceHistory>>;

  // Inventory management
  updateStock(updates: ProductStockUpdate[]): Promise<boolean>;
  checkInventory(
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<ProductInventoryCheck[]>;
  getLowStockProducts(sellerId: string, threshold?: number): Promise<ProductWithSeller[]>;

  // Product status and visibility
  publishProduct(id: string, sellerId: string): Promise<ProductWithDetails>;
  unpublishProduct(id: string, sellerId: string): Promise<ProductWithDetails>;
  markOutOfStock(id: string, sellerId: string): Promise<ProductWithDetails>;
  markInStock(id: string, sellerId: string): Promise<ProductWithDetails>;

  // Analytics and metrics
  incrementViewCount(id: string): Promise<void>;
  updateSalesCount(productId: string, quantity: number): Promise<void>;
  getProductStats(sellerId: string): Promise<{
    totalProducts: number;
    publishedProducts: number;
    outOfStockProducts: number;
    totalViews: number;
    totalSales: number;
  }>;

  // Utility methods
  generateSlug(name: string, sellerId: string): Promise<string>;
  validateCategories(categoryIds: string[]): Promise<boolean>;
  isProductOwner(productId: string, sellerId: string): Promise<boolean>;
  getProductsByIds(productIds: string[]): Promise<ProductWithSeller[]>;

  // Tag management
  getPopularTags(limit?: number): Promise<Array<{ tag: string; count: number }>>;
  getProductsByTag(tag: string, options?: ProductQueryOptions): Promise<ProductPaginationResult>;
}
