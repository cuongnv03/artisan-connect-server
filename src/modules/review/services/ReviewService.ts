import { IReviewService } from './ReviewService.interface';
import {
  Review,
  ReviewWithDetails,
  CreateReviewDto,
  UpdateReviewDto,
  ReviewStatistics,
  ReviewFilterOptions,
  MarkReviewHelpfulDto,
} from '../models/Review';
import { IReviewRepository } from '../repositories/ReviewRepository.interface';
import { IOrderRepository } from '../../order/repositories/OrderRepository.interface';
import { IUserRepository } from '../../user/repositories/UserRepository.interface';
import { IProductRepository } from '../../product/repositories/ProductRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { OrderStatus } from '../../order/models/OrderEnums';
import container from '../../../core/di/container';

export class ReviewService implements IReviewService {
  private reviewRepository: IReviewRepository;
  private orderRepository: IOrderRepository;
  private userRepository: IUserRepository;
  private productRepository: IProductRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.reviewRepository = container.resolve<IReviewRepository>('reviewRepository');
    this.orderRepository = container.resolve<IOrderRepository>('orderRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
    this.productRepository = container.resolve<IProductRepository>('productRepository');
  }

  /**
   * Create a new review
   */
  async createReview(userId: string, data: CreateReviewDto): Promise<ReviewWithDetails> {
    try {
      // Validate user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Validate product
      const product = await this.productRepository.findByIdWithDetails(data.productId);
      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      // Validate rating
      if (data.rating < 1 || data.rating > 5) {
        throw new AppError('Rating must be between 1 and 5', 400, 'INVALID_RATING');
      }

      // Verify that user has purchased this product
      const hasPurchased = await this.hasUserPurchasedProduct(userId, data.productId);
      if (!hasPurchased) {
        throw new AppError('You can only review products you have purchased', 403, 'NOT_PURCHASED');
      }

      // Check if user has already reviewed this product
      const existingReview = await this.reviewRepository.findByUserAndProduct(
        userId,
        data.productId,
      );
      if (existingReview) {
        throw new AppError('You have already reviewed this product', 409, 'REVIEW_EXISTS');
      }

      // Create review
      return await this.reviewRepository.createReview(userId, {
        productId: data.productId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        images: data.images || [],
      });
    } catch (error) {
      this.logger.error(`Error creating review: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create review', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Update an existing review
   */
  async updateReview(
    id: string,
    userId: string,
    data: UpdateReviewDto,
  ): Promise<ReviewWithDetails> {
    try {
      // Validate user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Validate rating if provided
      if (data.rating && (data.rating < 1 || data.rating > 5)) {
        throw new AppError('Rating must be between 1 and 5', 400, 'INVALID_RATING');
      }

      // Update review
      return await this.reviewRepository.updateReview(id, userId, data);
    } catch (error) {
      this.logger.error(`Error updating review: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update review', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(id: string, userId: string): Promise<boolean> {
    try {
      return await this.reviewRepository.deleteReview(id, userId);
    } catch (error) {
      this.logger.error(`Error deleting review: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete review', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get review by ID
   */
  async getReviewById(id: string): Promise<ReviewWithDetails | null> {
    try {
      return await this.reviewRepository.findByIdWithDetails(id);
    } catch (error) {
      this.logger.error(`Error getting review by ID: ${error}`);
      return null;
    }
  }

  /**
   * Get review by user and product
   */
  async getReviewByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<ReviewWithDetails | null> {
    try {
      return await this.reviewRepository.findByUserAndProduct(userId, productId);
    } catch (error) {
      this.logger.error(`Error getting review by user and product: ${error}`);
      return null;
    }
  }

  /**
   * Get reviews with filtering and pagination
   */
  async getReviews(options: ReviewFilterOptions): Promise<PaginatedResult<ReviewWithDetails>> {
    try {
      return await this.reviewRepository.getReviews(options);
    } catch (error) {
      this.logger.error(`Error getting reviews: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get reviews', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get product review statistics
   */
  async getProductReviewStatistics(productId: string): Promise<ReviewStatistics> {
    try {
      // Validate product
      const product = await this.productRepository.findByIdWithDetails(productId);
      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      return await this.reviewRepository.getProductReviewStatistics(productId);
    } catch (error) {
      this.logger.error(`Error getting product review statistics: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get review statistics', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Mark review as helpful or unhelpful
   */
  async markReviewHelpful(
    reviewId: string,
    userId: string,
    data: MarkReviewHelpfulDto,
  ): Promise<Review> {
    try {
      return await this.reviewRepository.markReviewHelpful(reviewId, userId, data.helpful);
    } catch (error) {
      this.logger.error(`Error marking review as helpful: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to mark review as helpful', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Check if user has marked review as helpful
   */
  async hasMarkedReviewHelpful(reviewId: string, userId: string): Promise<boolean> {
    try {
      return await this.reviewRepository.hasMarkedReviewHelpful(reviewId, userId);
    } catch (error) {
      this.logger.error(`Error checking if user has marked review as helpful: ${error}`);
      return false;
    }
  }

  /**
   * Get products that can be reviewed by user
   */
  async getReviewableProducts(
    userId: string,
  ): Promise<{ productId: string; orderId: string; orderDate: Date }[]> {
    try {
      return await this.reviewRepository.getReviewableProducts(userId);
    } catch (error) {
      this.logger.error(`Error getting reviewable products: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get reviewable products', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Check if user has purchased the product
   */
  private async hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    try {
      // Get user's orders
      const orders = await this.orderRepository.getOrders({
        userId,
        status: OrderStatus.DELIVERED,
      });

      // Check if any order contains this product
      for (const order of orders.data) {
        const orderWithDetails = await this.orderRepository.findByIdWithDetails(order.id);
        if (orderWithDetails) {
          for (const item of orderWithDetails.items) {
            if (item.productId === productId) {
              return true;
            }
          }
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Error checking if user has purchased product: ${error}`);
      return false;
    }
  }
}
