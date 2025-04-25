import {
  Product,
  ProductWithDetails,
  CreateProductDto,
  UpdateProductDto,
  PriceUpdateDto,
  ProductQueryOptions,
} from '../models/Product';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IProductService {
  /**
   * Create a new product
   */
  createProduct(sellerId: string, data: CreateProductDto): Promise<ProductWithDetails>;

  /**
   * Update a product
   */
  updateProduct(id: string, sellerId: string, data: UpdateProductDto): Promise<ProductWithDetails>;

  /**
   * Update product price
   */
  updatePrice(id: string, sellerId: string, data: PriceUpdateDto): Promise<ProductWithDetails>;

  /**
   * Delete a product
   */
  deleteProduct(id: string, sellerId: string): Promise<boolean>;

  /**
   * Get product by ID
   */
  getProductById(id: string): Promise<ProductWithDetails | null>;

  /**
   * Get products with pagination and filtering
   */
  getProducts(options: ProductQueryOptions): Promise<PaginatedResult<Product>>;

  /**
   * Get price history for a product
   */
  getPriceHistory(id: string, page?: number, limit?: number): Promise<PaginatedResult<any>>;
}
