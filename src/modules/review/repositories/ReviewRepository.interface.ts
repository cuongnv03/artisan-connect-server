import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { Review, ReviewWithDetails, ReviewStatistics, ReviewFilterOptions } from '../models/Review';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IReviewRepository extends BaseRepository<Review, string> {
  /**
   * Find review by ID with details
   */
  findByIdWithDetails(id: string): Promise<ReviewWithDetails | null>;

  /**
   * Find review by user and product
   */
  findByUserAndProduct(userId: string, productId: string): Promise<ReviewWithDetails | null>;

  /**
   * Get reviews with filtering and pagination
   */
  getReviews(options: ReviewFilterOptions): Promise<PaginatedResult<ReviewWithDetails>>;

  /**
   * Get product review statistics
   */
  getProductReviewStatistics(productId: string): Promise<ReviewStatistics>;

  /**
   * Create review
   */
  createReview(
    userId: string,
    data: Omit<
      Review,
      | 'id'
      | 'userId'
      | 'createdAt'
      | 'updatedAt'
      | 'helpfulCount'
      | 'isVerifiedPurchase'
      | 'orderItemId'
    >,
  ): Promise<ReviewWithDetails>;

  /**
   * Update review
   */
  updateReview(id: string, userId: string, data: Partial<Review>): Promise<ReviewWithDetails>;

  /**
   * Delete review
   */
  deleteReview(id: string, userId: string): Promise<boolean>;

  /**
   * Get products purchased by user that can be reviewed
   */
  getReviewableProducts(
    userId: string,
  ): Promise<{ productId: string; orderId: string; orderDate: Date }[]>;

  /**
   * Update product rating and review count
   */
  updateProductRatingAndReviewCount(productId: string): Promise<void>;

  /**
   * Check if user has purchased product
   */
  hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean>;
}
