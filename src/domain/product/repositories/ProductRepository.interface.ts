import { BaseRepository } from '../../repositories/BaseRepository';
import {
  Product,
  ProductWithDetails,
  CreateProductDto,
  UpdateProductDto,
  PriceUpdateDto,
  ProductQueryOptions,
} from '../entities/Product';
import { PaginatedResult } from '../../common/PaginatedResult';

export interface IProductRepository extends BaseRepository<Product, string> {
  /**
   * Find product by ID with details
   */
  findByIdWithDetails(id: string): Promise<ProductWithDetails | null>;

  /**
   * Create product
   */
  createProduct(sellerId: string, data: CreateProductDto): Promise<ProductWithDetails>;

  /**
   * Update product
   */
  updateProduct(id: string, sellerId: string, data: UpdateProductDto): Promise<ProductWithDetails>;

  /**
   * Update product price
   */
  updatePrice(id: string, sellerId: string, data: PriceUpdateDto): Promise<ProductWithDetails>;

  /**
   * Delete product (soft delete)
   */
  deleteProduct(id: string, sellerId: string): Promise<boolean>;

  /**
   * Get products with pagination
   */
  getProducts(options: ProductQueryOptions): Promise<PaginatedResult<Product>>;

  /**
   * Get price history
   */
  getPriceHistory(productId: string, page?: number, limit?: number): Promise<PaginatedResult<any>>;

  /**
   * Check if product belongs to seller
   */
  isProductOwner(productId: string, sellerId: string): Promise<boolean>;
}
