import { BaseService } from '../../../shared/baseClasses/BaseService';
import { IProductService } from './ProductService.interface';
import {
  Product,
  ProductWithDetails,
  CreateProductDto,
  UpdateProductDto,
  PriceUpdateDto,
  ProductQueryOptions,
} from '../models/Product';
import { IProductRepository } from '../repositories/ProductRepository.interface';
import { ICategoryRepository } from '../repositories/CategoryRepository.interface';
import { CloudinaryService } from '../../../core/infrastructure/storage/CloudinaryService';
import { AppError } from '../../../core/errors/AppError';
import { withErrorHandling } from '../../../shared/utils/ErrorHandling';
import { Validators } from '../../../shared/utils/Validators';
import { PaginationUtils } from '../../../shared/utils/PaginationUtils';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import container from '../../../core/di/container';

export class ProductService extends BaseService implements IProductService {
  private productRepository: IProductRepository;
  private categoryRepository: ICategoryRepository;
  private cloudinaryService: CloudinaryService;
  constructor() {
    super([
      { methodName: 'createProduct', errorMessage: 'Failed to create product' },
      { methodName: 'updateProduct', errorMessage: 'Failed to update product' },
      { methodName: 'deleteProduct', errorMessage: 'Failed to delete product' },
      { methodName: 'getProductById', errorMessage: 'Failed to get product by ID' },
      { methodName: 'getProducts', errorMessage: 'Failed to get products' },
      { methodName: 'getPriceHistory', errorMessage: 'Failed to get price history' },
      { methodName: 'updatePrice', errorMessage: 'Failed to update product price' },
    ]);
    this.productRepository = container.resolve<IProductRepository>('productRepository');
    this.categoryRepository = container.resolve<ICategoryRepository>('categoryRepository');
    this.cloudinaryService = container.resolve<CloudinaryService>('cloudinaryService');
  }

  /**
   * Create a new product
   */
  createProduct = withErrorHandling(
    async (sellerId: string, data: CreateProductDto): Promise<ProductWithDetails> => {
      Validators.validateNotEmpty(data.name, 'Product name');
      Validators.validatePositiveNumber(data.price, 'Price');
      Validators.validateNonEmptyArray(data.images, 'Product images');

      return await this.productRepository.createProduct(sellerId, data);
    },
    'Failed to create product',
    'PRODUCT_CREATION_ERROR',
  );

  /**
   * Validate product data
   */
  private validateProductData(data: CreateProductDto): void {
    // Validate name
    if (!data.name || data.name.trim().length < 3) {
      throw AppError.validationFailed('Product name must be at least 3 characters');
    }

    // Validate price
    if (data.price <= 0) {
      throw AppError.validationFailed('Price must be greater than 0');
    }

    // Validate discount price
    if (data.discountPrice !== null && data.discountPrice !== undefined) {
      if (data.discountPrice <= 0) {
        throw AppError.validationFailed('Discount price must be greater than 0');
      }
      if (data.discountPrice >= data.price) {
        throw AppError.validationFailed('Discount price must be less than regular price');
      }
    }

    // Validate quantity
    if (data.quantity < 0) {
      throw AppError.validationFailed('Quantity cannot be negative');
    }

    // Validate images
    if (!data.images || data.images.length === 0) {
      throw AppError.validationFailed('At least one product image is required');
    }
  }

  /**
   * Validate categories
   */
  private async validateCategories(categoryIds?: string[]): Promise<void> {
    if (!categoryIds || categoryIds.length === 0) {
      return;
    }

    // Check if all categories exist
    const categoryCount = await this.productRepository.countCategoriesByIds(categoryIds);
    if (categoryCount !== categoryIds.length) {
      throw AppError.validationFailed('One or more categories not found', 'INVALID_CATEGORIES');
    }
  }

  /**
   * Update a product
   */
  async updateProduct(
    id: string,
    sellerId: string,
    data: UpdateProductDto,
  ): Promise<ProductWithDetails> {
    try {
      // Get current product to handle image deletion if needed
      const currentProduct = await this.productRepository.findByIdWithDetails(id);

      if (!currentProduct) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (currentProduct.sellerId !== sellerId) {
        throw new AppError('You can only update your own products', 403, 'FORBIDDEN');
      }

      // Handle image replacement if needed
      if (data.images && currentProduct.images) {
        await this.handleImageReplacement(currentProduct.images, data.images);
      }

      return await this.productRepository.updateProduct(id, sellerId, data);
    } catch (error) {
      this.logger.error(`Error updating product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update product', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Update product price
   */
  async updatePrice(
    id: string,
    sellerId: string,
    data: PriceUpdateDto,
  ): Promise<ProductWithDetails> {
    try {
      return await this.productRepository.updatePrice(id, sellerId, data);
    } catch (error) {
      this.logger.error(`Error updating product price: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update product price', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string, sellerId: string): Promise<boolean> {
    try {
      // We'll use soft delete for products to maintain order history
      return await this.productRepository.deleteProduct(id, sellerId);
    } catch (error) {
      this.logger.error(`Error deleting product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete product', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<ProductWithDetails | null> {
    const product = await this.productRepository.findByIdWithDetails(id);
    try {
      return await Validators.validateExists(product, 'Product', id);
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get products with pagination and filtering
   */
  async getProducts(options: ProductQueryOptions): Promise<PaginatedResult<Product>> {
    const { page, limit } = PaginationUtils.normalizePaginationParams(options.page, options.limit);
    try {
      return await this.productRepository.getProducts({
        ...options,
        page,
        limit,
      });
    } catch (error) {
      this.logger.error(`Error getting products: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get products', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get price history for a product
   */
  async getPriceHistory(id: string, page?: number, limit?: number): Promise<PaginatedResult<any>> {
    try {
      return await this.productRepository.getPriceHistory(id, page, limit);
    } catch (error) {
      this.logger.error(`Error getting price history: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get price history', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Helper to handle image replacement and deletion
   */
  private async handleImageReplacement(oldImages: string[], newImages: string[]): Promise<void> {
    try {
      // Find images that are in old but not in new (to be deleted)
      const imagesToDelete = oldImages.filter((img) => !newImages.includes(img));

      // Delete unused images from Cloudinary
      for (const imageUrl of imagesToDelete) {
        if (imageUrl.includes('cloudinary')) {
          const publicId = this.extractPublicIdFromUrl(imageUrl);
          if (publicId) {
            await this.cloudinaryService.deleteFile(publicId);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error handling image replacement: ${error}`);
      // We don't want to fail the whole operation if image deletion fails
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  private extractPublicIdFromUrl(url: string): string | null {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }

    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const afterUpload = parts[1];
    // Remove any transformation parameters
    const withoutParams = afterUpload.split('/').pop();
    if (!withoutParams) return null;

    // Remove file extension
    const publicId = withoutParams.split('.')[0];
    return publicId;
  }
}
