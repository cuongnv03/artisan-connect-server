import { IProductService } from './ProductService.interface';
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
import { IProductRepository } from '../repositories/ProductRepository.interface';
import { ICategoryRepository } from '../repositories/CategoryRepository.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { CloudinaryService } from '../../../core/infrastructure/storage/CloudinaryService';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import container from '../../../core/di/container';

export class ProductService implements IProductService {
  private productRepository: IProductRepository;
  private categoryRepository: ICategoryRepository;
  private userRepository: IUserRepository;
  private cloudinaryService: CloudinaryService;
  private logger = Logger.getInstance();

  constructor() {
    this.productRepository = container.resolve<IProductRepository>('productRepository');
    this.categoryRepository = container.resolve<ICategoryRepository>('categoryRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
    this.cloudinaryService = container.resolve<CloudinaryService>('cloudinaryService');
  }

  async createProduct(sellerId: string, data: CreateProductDto): Promise<ProductWithDetails> {
    try {
      // Validate seller exists and is artisan
      const seller = await this.userRepository.findById(sellerId);
      if (!seller) {
        throw new AppError('Seller not found', 404, 'SELLER_NOT_FOUND');
      }

      if (seller.role !== 'ARTISAN') {
        throw new AppError('Only artisans can create products', 403, 'FORBIDDEN');
      }

      // Validate categories if provided
      if (data.categories && data.categories.length > 0) {
        const validCategories = await this.categoryRepository.validateCategories(data.categories);
        if (!validCategories) {
          throw new AppError('One or more categories are invalid', 400, 'INVALID_CATEGORIES');
        }
      }

      // Validate product data
      this.validateProductData(data);

      const product = await this.productRepository.createProduct(sellerId, data);

      this.logger.info(`Product created: ${product.id} "${product.name}" by seller ${sellerId}`);

      return product;
    } catch (error) {
      this.logger.error(`Error creating product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create product', 500, 'SERVICE_ERROR');
    }
  }

  async updateProduct(
    id: string,
    sellerId: string,
    data: UpdateProductDto,
  ): Promise<ProductWithDetails> {
    try {
      // Validate categories if provided
      if (data.categories && data.categories.length > 0) {
        const validCategories = await this.categoryRepository.validateCategories(data.categories);
        if (!validCategories) {
          throw new AppError('One or more categories are invalid', 400, 'INVALID_CATEGORIES');
        }
      }

      // Validate updated data
      if (data.name || data.price || data.quantity !== undefined) {
        this.validateProductUpdateData(data);
      }

      const product = await this.productRepository.updateProduct(id, sellerId, data);

      this.logger.info(`Product updated: ${id} by seller ${sellerId}`);

      return product;
    } catch (error) {
      this.logger.error(`Error updating product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update product', 500, 'SERVICE_ERROR');
    }
  }

  async getProductById(id: string, requestUserId?: string): Promise<ProductWithDetails | null> {
    try {
      return await this.productRepository.findByIdWithDetails(id, requestUserId);
    } catch (error) {
      this.logger.error(`Error getting product by ID: ${error}`);
      return null;
    }
  }

  async getProductBySlug(slug: string, requestUserId?: string): Promise<ProductWithDetails | null> {
    try {
      return await this.productRepository.findBySlugWithDetails(slug, requestUserId);
    } catch (error) {
      this.logger.error(`Error getting product by slug: ${error}`);
      return null;
    }
  }

  async deleteProduct(id: string, sellerId: string): Promise<boolean> {
    try {
      const result = await this.productRepository.deleteProduct(id, sellerId);

      if (result) {
        this.logger.info(`Product deleted: ${id} by seller ${sellerId}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error deleting product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete product', 500, 'SERVICE_ERROR');
    }
  }

  async getProducts(
    options?: ProductQueryOptions,
    requestUserId?: string,
  ): Promise<ProductPaginationResult> {
    try {
      return await this.productRepository.getProducts(options || {}, requestUserId);
    } catch (error) {
      this.logger.error(`Error getting products: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get products', 500, 'SERVICE_ERROR');
    }
  }

  async getMyProducts(
    sellerId: string,
    options?: Omit<ProductQueryOptions, 'sellerId'>,
  ): Promise<ProductPaginationResult> {
    try {
      return await this.productRepository.getMyProducts(sellerId, options);
    } catch (error) {
      this.logger.error(`Error getting my products: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get my products', 500, 'SERVICE_ERROR');
    }
  }

  async searchProducts(
    query: string,
    options?: ProductQueryOptions,
  ): Promise<ProductPaginationResult> {
    try {
      return await this.productRepository.searchProducts(query, options);
    } catch (error) {
      this.logger.error(`Error searching products: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to search products', 500, 'SERVICE_ERROR');
    }
  }

  async getProductsByCategory(
    categoryId: string,
    options?: ProductQueryOptions,
  ): Promise<ProductPaginationResult> {
    try {
      return await this.productRepository.getProductsByCategory(categoryId, options);
    } catch (error) {
      this.logger.error(`Error getting products by category: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get products by category', 500, 'SERVICE_ERROR');
    }
  }

  async getFeaturedProducts(limit: number = 10): Promise<ProductWithSeller[]> {
    try {
      return await this.productRepository.getFeaturedProducts(limit);
    } catch (error) {
      this.logger.error(`Error getting featured products: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get featured products', 500, 'SERVICE_ERROR');
    }
  }

  async getRelatedProducts(productId: string, limit: number = 5): Promise<ProductWithSeller[]> {
    try {
      return await this.productRepository.getRelatedProducts(productId, limit);
    } catch (error) {
      this.logger.error(`Error getting related products: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get related products', 500, 'SERVICE_ERROR');
    }
  }

  async updatePrice(
    id: string,
    sellerId: string,
    data: PriceUpdateDto,
  ): Promise<ProductWithDetails> {
    try {
      if (data.price <= 0) {
        throw new AppError('Price must be greater than 0', 400, 'INVALID_PRICE');
      }

      const product = await this.productRepository.updatePrice(id, sellerId, data);

      this.logger.info(`Product price updated: ${id} to ${data.price} by seller ${sellerId}`);

      return product;
    } catch (error) {
      this.logger.error(`Error updating product price: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update product price', 500, 'SERVICE_ERROR');
    }
  }

  async getPriceHistory(
    productId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<PriceHistory>> {
    try {
      return await this.productRepository.getPriceHistory(productId, page, limit);
    } catch (error) {
      this.logger.error(`Error getting price history: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get price history', 500, 'SERVICE_ERROR');
    }
  }

  async updateStock(updates: ProductStockUpdate[]): Promise<boolean> {
    try {
      return await this.productRepository.updateStock(updates);
    } catch (error) {
      this.logger.error(`Error updating stock: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update stock', 500, 'SERVICE_ERROR');
    }
  }

  async checkInventory(
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<ProductInventoryCheck[]> {
    try {
      return await this.productRepository.checkInventory(items);
    } catch (error) {
      this.logger.error(`Error checking inventory: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to check inventory', 500, 'SERVICE_ERROR');
    }
  }

  async getLowStockProducts(sellerId: string, threshold: number = 5): Promise<ProductWithSeller[]> {
    try {
      return await this.productRepository.getLowStockProducts(sellerId, threshold);
    } catch (error) {
      this.logger.error(`Error getting low stock products: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get low stock products', 500, 'SERVICE_ERROR');
    }
  }

  async publishProduct(id: string, sellerId: string): Promise<ProductWithDetails> {
    try {
      const product = await this.productRepository.publishProduct(id, sellerId);

      this.logger.info(`Product published: ${id} by seller ${sellerId}`);

      return product;
    } catch (error) {
      this.logger.error(`Error publishing product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to publish product', 500, 'SERVICE_ERROR');
    }
  }

  async unpublishProduct(id: string, sellerId: string): Promise<ProductWithDetails> {
    try {
      const product = await this.productRepository.unpublishProduct(id, sellerId);

      this.logger.info(`Product unpublished: ${id} by seller ${sellerId}`);

      return product;
    } catch (error) {
      this.logger.error(`Error unpublishing product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to unpublish product', 500, 'SERVICE_ERROR');
    }
  }

  async markOutOfStock(id: string, sellerId: string): Promise<ProductWithDetails> {
    try {
      const product = await this.productRepository.markOutOfStock(id, sellerId);

      this.logger.info(`Product marked out of stock: ${id} by seller ${sellerId}`);

      return product;
    } catch (error) {
      this.logger.error(`Error marking product out of stock: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to mark product out of stock', 500, 'SERVICE_ERROR');
    }
  }

  async markInStock(id: string, sellerId: string): Promise<ProductWithDetails> {
    try {
      const product = await this.productRepository.markInStock(id, sellerId);

      this.logger.info(`Product marked in stock: ${id} by seller ${sellerId}`);

      return product;
    } catch (error) {
      this.logger.error(`Error marking product in stock: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to mark product in stock', 500, 'SERVICE_ERROR');
    }
  }

  async viewProduct(id: string, userId?: string): Promise<void> {
    try {
      await this.productRepository.incrementViewCount(id);

      if (userId) {
        this.logger.debug(`Product ${id} viewed by user ${userId}`);
      } else {
        this.logger.debug(`Product ${id} viewed by anonymous user`);
      }
    } catch (error) {
      this.logger.error(`Error viewing product: ${error}`);
      // Don't throw errors for view increments
    }
  }

  async getProductStats(sellerId: string): Promise<{
    totalProducts: number;
    publishedProducts: number;
    outOfStockProducts: number;
    totalViews: number;
    totalSales: number;
  }> {
    try {
      return await this.productRepository.getProductStats(sellerId);
    } catch (error) {
      this.logger.error(`Error getting product stats: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get product stats', 500, 'SERVICE_ERROR');
    }
  }

  async getProductsByIds(productIds: string[]): Promise<ProductWithSeller[]> {
    try {
      return await this.productRepository.getProductsByIds(productIds);
    } catch (error) {
      this.logger.error(`Error getting products by IDs: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get products by IDs', 500, 'SERVICE_ERROR');
    }
  }

  async getPopularTags(limit: number = 20): Promise<Array<{ tag: string; count: number }>> {
    try {
      return await this.productRepository.getPopularTags(limit);
    } catch (error) {
      this.logger.error(`Error getting popular tags: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get popular tags', 500, 'SERVICE_ERROR');
    }
  }

  async getProductsByTag(
    tag: string,
    options?: ProductQueryOptions,
  ): Promise<ProductPaginationResult> {
    try {
      return await this.productRepository.getProductsByTag(tag, options);
    } catch (error) {
      this.logger.error(`Error getting products by tag: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get products by tag', 500, 'SERVICE_ERROR');
    }
  }

  // Private validation methods
  private validateProductData(data: CreateProductDto): void {
    if (!data.name || data.name.trim().length < 3) {
      throw new AppError('Product name must be at least 3 characters', 400, 'INVALID_PRODUCT_NAME');
    }

    if (data.price <= 0) {
      throw new AppError('Price must be greater than 0', 400, 'INVALID_PRICE');
    }

    if (data.discountPrice !== null && data.discountPrice !== undefined) {
      if (data.discountPrice <= 0) {
        throw new AppError('Discount price must be greater than 0', 400, 'INVALID_DISCOUNT_PRICE');
      }
      if (data.discountPrice >= data.price) {
        throw new AppError(
          'Discount price must be less than regular price',
          400,
          'INVALID_DISCOUNT_PRICE',
        );
      }
    }

    if (data.quantity < 0) {
      throw new AppError('Quantity cannot be negative', 400, 'INVALID_QUANTITY');
    }

    if (!data.images || data.images.length === 0) {
      throw new AppError('At least one product image is required', 400, 'MISSING_IMAGES');
    }

    if (data.weight !== undefined && data.weight < 0) {
      throw new AppError('Weight cannot be negative', 400, 'INVALID_WEIGHT');
    }
  }

  private validateProductUpdateData(data: UpdateProductDto): void {
    if (data.name !== undefined && (!data.name || data.name.trim().length < 3)) {
      throw new AppError('Product name must be at least 3 characters', 400, 'INVALID_PRODUCT_NAME');
    }

    if (data.price !== undefined && data.price <= 0) {
      throw new AppError('Price must be greater than 0', 400, 'INVALID_PRICE');
    }

    if (data.discountPrice !== undefined && data.discountPrice !== null) {
      if (data.discountPrice <= 0) {
        throw new AppError('Discount price must be greater than 0', 400, 'INVALID_DISCOUNT_PRICE');
      }
      if (data.price !== undefined && data.discountPrice >= data.price) {
        throw new AppError(
          'Discount price must be less than regular price',
          400,
          'INVALID_DISCOUNT_PRICE',
        );
      }
    }

    if (data.quantity !== undefined && data.quantity < 0) {
      throw new AppError('Quantity cannot be negative', 400, 'INVALID_QUANTITY');
    }

    if (data.images !== undefined && (!data.images || data.images.length === 0)) {
      throw new AppError('At least one product image is required', 400, 'MISSING_IMAGES');
    }

    if (data.weight !== undefined && data.weight !== null && data.weight < 0) {
      throw new AppError('Weight cannot be negative', 400, 'INVALID_WEIGHT');
    }
  }
}
