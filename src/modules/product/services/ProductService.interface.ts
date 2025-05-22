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

export interface IProductService {
  // Product CRUD
  createProduct(sellerId: string, data: CreateProductDto): Promise<ProductWithDetails>;
  updateProduct(id: string, sellerId: string, data: UpdateProductDto): Promise<ProductWithDetails>;
  getProductById(id: string, requestUserId?: string): Promise<ProductWithDetails | null>;
  getProductBySlug(slug: string, requestUserId?: string): Promise<ProductWithDetails | null>;
  deleteProduct(id: string, sellerId: string): Promise<boolean>;

  // Product queries
  getProducts(
    options?: ProductQueryOptions,
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

  // Analytics
  viewProduct(id: string, userId?: string): Promise<void>;
  getProductStats(sellerId: string): Promise<{
    totalProducts: number;
    publishedProducts: number;
    outOfStockProducts: number;
    totalViews: number;
    totalSales: number;
  }>;

  // Utility methods
  getProductsByIds(productIds: string[]): Promise<ProductWithSeller[]>;
  getPopularTags(limit?: number): Promise<Array<{ tag: string; count: number }>>;
  getProductsByTag(tag: string, options?: ProductQueryOptions): Promise<ProductPaginationResult>;
}
