import { IProductService } from './ProductService.interface';
import {
  Product,
  ProductWithDetails,
  CreateProductDto,
  UpdateProductDto,
  PriceUpdateDto,
  ProductQueryOptions,
} from '../../../domain/product/entities/Product';
import { IProductRepository } from '../../../domain/product/repositories/ProductRepository.interface';
import { CloudinaryService } from '../../../infrastructure/storage/CloudinaryService';
import { AppError } from '../../../shared/errors/AppError';
import { Logger } from '../../../shared/utils/Logger';
import { PaginatedResult } from '../../../domain/common/PaginatedResult';
import container from '../../../di/container';

export class ProductService implements IProductService {
  private productRepository: IProductRepository;
  private cloudinaryService: CloudinaryService;
  private logger = Logger.getInstance();

  constructor() {
    this.productRepository = container.resolve<IProductRepository>('productRepository');
    this.cloudinaryService = container.resolve<CloudinaryService>('cloudinaryService');
  }

  /**
   * Create a new product
   */
  async createProduct(sellerId: string, data: CreateProductDto): Promise<ProductWithDetails> {
    try {
      return await this.productRepository.createProduct(sellerId, data);
    } catch (error) {
      this.logger.error(`Error creating product: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create product', 500, 'SERVICE_ERROR');
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
    try {
      return await this.productRepository.findByIdWithDetails(id);
    } catch (error) {
      this.logger.error(`Error getting product: ${error}`);
      return null;
    }
  }

  /**
   * Get products with pagination and filtering
   */
  async getProducts(options: ProductQueryOptions): Promise<PaginatedResult<Product>> {
    try {
      return await this.productRepository.getProducts(options);
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
