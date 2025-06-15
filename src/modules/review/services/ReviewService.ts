import { IReviewService } from './ReviewService.interface';
import {
  Review,
  ReviewWithDetails,
  CreateReviewDto,
  UpdateReviewDto,
  ReviewStatistics,
  ReviewFilterOptions,
} from '../models/Review';
import { IReviewRepository } from '../repositories/ReviewRepository.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { IProductRepository } from '../../product/repositories/ProductRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import container from '../../../core/di/container';

export class ReviewService implements IReviewService {
  private reviewRepository: IReviewRepository;
  private userRepository: IUserRepository;
  private productRepository: IProductRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.reviewRepository = container.resolve<IReviewRepository>('reviewRepository');
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
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      // Validate product
      const product = await this.productRepository.findById(data.productId);
      if (!product) {
        throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
      }

      // Validate rating
      if (data.rating < 1 || data.rating > 5) {
        throw AppError.badRequest('Rating must be between 1 and 5', 'INVALID_RATING');
      }

      // Check if user has already reviewed this product
      const existingReview = await this.reviewRepository.findByUserAndProduct(
        userId,
        data.productId,
      );
      if (existingReview) {
        throw AppError.conflict('You have already reviewed this product', 'REVIEW_EXISTS');
      }

      // Create review
      const review = await this.reviewRepository.createReview(userId, {
        productId: data.productId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        images: data.images || [],
      });

      this.logger.info(
        `User ${userId} created review for product ${data.productId} with rating ${data.rating}`,
      );

      return review;
    } catch (error) {
      this.logger.error(`Error creating review: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to create review', 'SERVICE_ERROR');
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
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      // Validate rating if provided
      if (data.rating && (data.rating < 1 || data.rating > 5)) {
        throw AppError.badRequest('Rating must be between 1 and 5', 'INVALID_RATING');
      }

      // Get original review for logging changes
      const originalReview = await this.reviewRepository.findById(id);
      if (!originalReview) {
        throw AppError.notFound('Review not found', 'REVIEW_NOT_FOUND');
      }

      // Update review
      const updatedReview = await this.reviewRepository.updateReview(id, userId, data);

      // Log review update with specific changes
      let changesLog = '';
      if (data.rating && data.rating !== originalReview.rating) {
        changesLog += `rating changed from ${originalReview.rating} to ${data.rating}, `;
      }
      if (data.title !== undefined && data.title !== originalReview.title) {
        changesLog += 'title updated, ';
      }
      if (data.comment !== undefined && data.comment !== originalReview.comment) {
        changesLog += 'comment updated, ';
      }
      if (data.images && JSON.stringify(data.images) !== JSON.stringify(originalReview.images)) {
        changesLog += 'images updated, ';
      }

      this.logger.info(
        `User ${userId} updated review ${id} for product ${updatedReview.productId}: ${changesLog.slice(0, -2)}`,
      );

      return updatedReview;
    } catch (error) {
      this.logger.error(`Error updating review: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update review', 'SERVICE_ERROR');
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(id: string, userId: string): Promise<boolean> {
    try {
      // Get review details before deletion for logging
      const review = await this.reviewRepository.findById(id);
      if (!review) {
        throw AppError.notFound('Review not found', 'REVIEW_NOT_FOUND');
      }

      if (review.userId !== userId) {
        throw AppError.forbidden('You can only delete your own reviews', 'FORBIDDEN');
      }

      const result = await this.reviewRepository.deleteReview(id, userId);

      if (result) {
        this.logger.info(`User ${userId} deleted review ${id} for product ${review.productId}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error deleting review: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to delete review', 'SERVICE_ERROR');
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
      // Validate user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      // Validate product
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
      }

      return await this.reviewRepository.findByUserAndProduct(userId, productId);
    } catch (error) {
      this.logger.error(`Error getting review by user and product: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get user product review', 'SERVICE_ERROR');
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
      throw AppError.internal('Failed to get reviews', 'SERVICE_ERROR');
    }
  }

  /**
   * Get product review statistics
   */
  async getProductReviewStatistics(productId: string): Promise<ReviewStatistics> {
    try {
      // Validate product exists first
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
      }

      return await this.reviewRepository.getProductReviewStatistics(productId);
    } catch (error) {
      this.logger.error(`Error getting product review statistics: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get review statistics', 'SERVICE_ERROR');
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
      throw AppError.internal('Failed to get reviewable products', 'SERVICE_ERROR');
    }
  }
}
