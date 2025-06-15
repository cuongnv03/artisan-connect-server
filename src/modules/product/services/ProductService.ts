import { IProductService } from './ProductService.interface';
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
import { IProductRepository } from '../repositories/ProductRepository.interface';
import { ICategoryRepository } from '../repositories/CategoryRepository.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import container from '../../../core/di/container';

export class ProductService implements IProductService {
  private productRepository: IProductRepository;
  private categoryRepository: ICategoryRepository;
  private userRepository: IUserRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.productRepository = container.resolve<IProductRepository>('productRepository');
    this.categoryRepository = container.resolve<ICategoryRepository>('categoryRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
  }

  async createProduct(sellerId: string, data: CreateProductDto): Promise<ProductWithDetails> {
    try {
      // Validate seller exists and is artisan
      const seller = await this.userRepository.findById(sellerId);
      if (!seller) {
        throw AppError.notFound('Seller not found', 'SELLER_NOT_FOUND');
      }

      if (seller.role !== 'ARTISAN') {
        throw AppError.forbidden('Only artisans can create products', 'FORBIDDEN');
      }

      // Validate product data
      this.validateProductData(data);

      // Validate categories if provided
      if (data.categoryIds && data.categoryIds.length > 0) {
        const validCategories = await this.validateCategories(data.categoryIds);
        if (!validCategories) {
          throw AppError.badRequest('One or more categories are invalid', 'INVALID_CATEGORIES');
        }
      }

      const product = await this.productRepository.createProduct(sellerId, data);

      this.logger.info(`Product created: ${product.id} "${product.name}" by seller ${sellerId}`);

      return product;
    } catch (error) {
      this.logger.error(`Error creating product: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to create product', 'SERVICE_ERROR');
    }
  }

  async updateProduct(
    id: string,
    sellerId: string,
    data: UpdateProductDto,
  ): Promise<ProductWithDetails> {
    try {
      // Validate update data
      if (data.name || data.price !== undefined) {
        this.validateProductUpdateData(data);
      }

      // Validate categories if provided
      if (data.categoryIds && data.categoryIds.length > 0) {
        const validCategories = await this.validateCategories(data.categoryIds);
        if (!validCategories) {
          throw AppError.badRequest('One or more categories are invalid', 'INVALID_CATEGORIES');
        }
      }

      const product = await this.productRepository.updateProduct(id, sellerId, data);

      this.logger.info(`Product updated: ${id} by seller ${sellerId}`);

      return product;
    } catch (error) {
      this.logger.error(`Error updating product: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update product', 'SERVICE_ERROR');
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
      throw AppError.internal('Failed to delete product', 'SERVICE_ERROR');
    }
  }

  async getProductById(id: string, userId?: string): Promise<ProductWithDetails | null> {
    try {
      return await this.productRepository.getProductById(id, userId);
    } catch (error) {
      this.logger.error(`Error getting product by ID: ${error}`);
      return null;
    }
  }

  async getProductBySlug(slug: string, userId?: string): Promise<ProductWithDetails | null> {
    try {
      return await this.productRepository.getProductBySlug(slug, userId);
    } catch (error) {
      this.logger.error(`Error getting product by slug: ${error}`);
      return null;
    }
  }

  async getProducts(options: ProductQueryOptions = {}): Promise<ProductPaginationResult> {
    try {
      return await this.productRepository.getProducts(options);
    } catch (error) {
      this.logger.error(`Error getting products: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get products', 'SERVICE_ERROR');
    }
  }

  async getMyProducts(
    sellerId: string,
    options: Omit<ProductQueryOptions, 'sellerId'> = {},
  ): Promise<ProductPaginationResult> {
    try {
      return await this.productRepository.getMyProducts(sellerId, options);
    } catch (error) {
      this.logger.error(`Error getting my products: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get my products', 'SERVICE_ERROR');
    }
  }

  async searchProducts(
    query: string,
    options: ProductQueryOptions = {},
  ): Promise<ProductPaginationResult> {
    try {
      if (!query || query.trim().length === 0) {
        throw AppError.badRequest('Search query is required', 'INVALID_QUERY');
      }

      return await this.productRepository.searchProducts(query, options);
    } catch (error) {
      this.logger.error(`Error searching products: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to search products', 'SERVICE_ERROR');
    }
  }

  async updatePrice(
    id: string,
    sellerId: string,
    price: number,
    note?: string,
  ): Promise<ProductWithDetails> {
    try {
      if (price <= 0) {
        throw AppError.badRequest('Price must be greater than 0', 'INVALID_PRICE');
      }

      const product = await this.productRepository.updatePrice(id, sellerId, price, note);

      this.logger.info(`Product price updated: ${id} to ${price} by seller ${sellerId}`);

      return product;
    } catch (error) {
      this.logger.error(`Error updating product price: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update product price', 'SERVICE_ERROR');
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
      throw AppError.internal('Failed to get price history', 'SERVICE_ERROR');
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
      throw AppError.internal('Failed to publish product', 'SERVICE_ERROR');
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
      throw AppError.internal('Failed to unpublish product', 'SERVICE_ERROR');
    }
  }

  async viewProduct(id: string): Promise<void> {
    try {
      await this.productRepository.incrementViewCount(id);
    } catch (error) {
      this.logger.error(`Error viewing product: ${error}`);
      // Don't throw errors for view increments
    }
  }

  async getProductStats(sellerId: string): Promise<ProductStats> {
    try {
      return await this.productRepository.getProductStats(sellerId);
    } catch (error) {
      this.logger.error(`Error getting product stats: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get product stats', 'SERVICE_ERROR');
    }
  }

  // Private validation methods
  private validateProductData(data: CreateProductDto): void {
    if (!data.name || data.name.trim().length < 3) {
      throw AppError.badRequest(
        'Product name must be at least 3 characters',
        'INVALID_PRODUCT_NAME',
      );
    }

    if (data.price <= 0) {
      throw AppError.badRequest('Price must be greater than 0', 'INVALID_PRICE');
    }

    if (data.discountPrice !== null && data.discountPrice !== undefined) {
      if (data.discountPrice <= 0) {
        throw AppError.badRequest(
          'Discount price must be greater than 0',
          'INVALID_DISCOUNT_PRICE',
        );
      }
      if (data.discountPrice >= data.price) {
        throw AppError.badRequest(
          'Discount price must be less than regular price',
          'INVALID_DISCOUNT_PRICE',
        );
      }
    }

    if (data.quantity < 0) {
      throw AppError.badRequest('Quantity cannot be negative', 'INVALID_QUANTITY');
    }

    if (!data.images || data.images.length === 0) {
      throw AppError.badRequest('At least one product image is required', 'MISSING_IMAGES');
    }

    if (!data.categoryIds || data.categoryIds.length === 0) {
      throw AppError.badRequest('At least one category is required', 'MISSING_CATEGORIES');
    }
  }

  private validateProductUpdateData(data: UpdateProductDto): void {
    if (data.name !== undefined && (!data.name || data.name.trim().length < 3)) {
      throw AppError.badRequest(
        'Product name must be at least 3 characters',
        'INVALID_PRODUCT_NAME',
      );
    }

    if (data.price !== undefined && data.price <= 0) {
      throw AppError.badRequest('Price must be greater than 0', 'INVALID_PRICE');
    }

    if (data.discountPrice !== undefined && data.discountPrice !== null) {
      if (data.discountPrice <= 0) {
        throw AppError.badRequest(
          'Discount price must be greater than 0',
          'INVALID_DISCOUNT_PRICE',
        );
      }
      if (data.price !== undefined && data.discountPrice >= data.price) {
        throw AppError.badRequest(
          'Discount price must be less than regular price',
          'INVALID_DISCOUNT_PRICE',
        );
      }
    }

    if (data.quantity !== undefined && data.quantity < 0) {
      throw AppError.badRequest('Quantity cannot be negative', 'INVALID_QUANTITY');
    }

    if (data.images !== undefined && (!data.images || data.images.length === 0)) {
      throw AppError.badRequest('At least one product image is required', 'MISSING_IMAGES');
    }

    if (data.categoryIds !== undefined && (!data.categoryIds || data.categoryIds.length === 0)) {
      throw AppError.badRequest('At least one category is required', 'MISSING_CATEGORIES');
    }
  }

  private async validateCategories(categoryIds: string[]): Promise<boolean> {
    try {
      // Check if all categories exist and are active
      for (const categoryId of categoryIds) {
        const category = await this.categoryRepository.findById(categoryId);
        if (!category || !category.isActive) {
          return false;
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}
