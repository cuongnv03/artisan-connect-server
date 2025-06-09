import { IProductService } from './ProductService.interface';
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
import { IProductRepository } from '../repositories/ProductRepository.interface';
import { ICategoryRepository } from '../repositories/CategoryRepository.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { IProductAttributeService } from './ProductAttributeService.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import container from '../../../core/di/container';

export class ProductService implements IProductService {
  private productRepository: IProductRepository;
  private categoryRepository: ICategoryRepository;
  private userRepository: IUserRepository;
  private attributeService: IProductAttributeService;
  private logger = Logger.getInstance();

  constructor() {
    this.productRepository = container.resolve<IProductRepository>('productRepository');
    this.categoryRepository = container.resolve<ICategoryRepository>('categoryRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
    this.attributeService = container.resolve<IProductAttributeService>('productAttributeService');
  }

  async createProduct(sellerId: string, data: CreateProductDto): Promise<ProductWithSeller> {
    try {
      // Validate seller exists and is artisan
      const seller = await this.userRepository.findById(sellerId);
      if (!seller) {
        throw new AppError('Seller not found', 404, 'SELLER_NOT_FOUND');
      }

      if (seller.role !== 'ARTISAN') {
        throw new AppError('Only artisans can create products', 403, 'FORBIDDEN');
      }

      // Validate product data
      this.validateProductData(data);

      // Validate categories if provided
      if (data.categories && data.categories.length > 0) {
        const validCategories = await this.validateCategories(data.categories);
        if (!validCategories) {
          throw new AppError('One or more categories are invalid', 400, 'INVALID_CATEGORIES');
        }
      }

      const product = await this.productRepository.createProduct(sellerId, data);

      // Set attributes if provided
      if (data.attributes && data.attributes.length > 0) {
        try {
          await this.attributeService.setProductAttributes(product.id, sellerId, data.attributes);
        } catch (error) {
          this.logger.warn(`Failed to set product attributes: ${error}`);
        }
      }

      // Create variants if provided
      if (data.variants && data.variants.length > 0) {
        try {
          for (const variantData of data.variants) {
            await this.attributeService.createProductVariant(product.id, sellerId, variantData);
          }
        } catch (error) {
          this.logger.warn(`Failed to create product variants: ${error}`);
        }
      }

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
  ): Promise<ProductWithSeller> {
    try {
      // Validate update data
      if (data.name || data.price !== undefined) {
        this.validateProductUpdateData(data);
      }

      // Validate categories if provided
      if (data.categories && data.categories.length > 0) {
        const validCategories = await this.validateCategories(data.categories);
        if (!validCategories) {
          throw new AppError('One or more categories are invalid', 400, 'INVALID_CATEGORIES');
        }
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

  async getProductById(id: string): Promise<ProductWithSeller | null> {
    try {
      const product = await this.productRepository.getProductById(id);
      if (!product) return null;

      // Get enhanced product with attributes and variants
      return await this.getProductWithDetails(product);
    } catch (error) {
      this.logger.error(`Error getting product by ID: ${error}`);
      return null;
    }
  }

  async getProductBySlug(slug: string): Promise<ProductWithSeller | null> {
    try {
      const product = await this.productRepository.getProductBySlug(slug);
      if (!product) return null;

      // Get enhanced product with attributes and variants
      return await this.getProductWithDetails(product);
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
      throw new AppError('Failed to get products', 500, 'SERVICE_ERROR');
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
      throw new AppError('Failed to get my products', 500, 'SERVICE_ERROR');
    }
  }

  async searchProducts(
    query: string,
    options: ProductQueryOptions = {},
  ): Promise<ProductPaginationResult> {
    try {
      if (!query || query.trim().length === 0) {
        throw new AppError('Search query is required', 400, 'INVALID_QUERY');
      }

      return await this.productRepository.searchProducts(query, options);
    } catch (error) {
      this.logger.error(`Error searching products: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to search products', 500, 'SERVICE_ERROR');
    }
  }

  async updatePrice(
    id: string,
    sellerId: string,
    price: number,
    note?: string,
  ): Promise<ProductWithSeller> {
    try {
      if (price <= 0) {
        throw new AppError('Price must be greater than 0', 400, 'INVALID_PRICE');
      }

      const product = await this.productRepository.updatePrice(id, sellerId, price, note);

      this.logger.info(`Product price updated: ${id} to ${price} by seller ${sellerId}`);

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

  async publishProduct(id: string, sellerId: string): Promise<ProductWithSeller> {
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

  async unpublishProduct(id: string, sellerId: string): Promise<ProductWithSeller> {
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
      throw new AppError('Failed to get product stats', 500, 'SERVICE_ERROR');
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
  }

  private async validateCategories(categoryIds: string[]): Promise<boolean> {
    try {
      // Simple validation - check if all categories exist
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

  private async getProductWithDetails(product: ProductWithSeller): Promise<ProductWithSeller> {
    try {
      // Get attributes
      const attributes = await this.attributeService.getProductAttributes(product.id);

      // Get variants
      const variants = await this.attributeService.getProductVariants(product.id);

      return {
        ...product,
        attributes,
        variants,
      } as any; // Type assertion since extending the interface
    } catch (error) {
      this.logger.warn(`Failed to get product details: ${error}`);
      return product;
    }
  }
}
