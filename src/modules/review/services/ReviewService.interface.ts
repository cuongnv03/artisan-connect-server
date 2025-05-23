import {
  Review,
  ReviewWithDetails,
  CreateReviewDto,
  UpdateReviewDto,
  ReviewStatistics,
  ReviewFilterOptions,
} from '../models/Review';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IReviewService {
  /**
   * Create a new review
   */
  createReview(userId: string, data: CreateReviewDto): Promise<ReviewWithDetails>;

  /**
   * Update an existing review
   */
  updateReview(id: string, userId: string, data: UpdateReviewDto): Promise<ReviewWithDetails>;

  /**
   * Delete a review
   */
  deleteReview(id: string, userId: string): Promise<boolean>;

  /**
   * Get review by ID
   */
  getReviewById(id: string): Promise<ReviewWithDetails | null>;

  /**
   * Get review by user and product
   */
  getReviewByUserAndProduct(userId: string, productId: string): Promise<ReviewWithDetails | null>;

  /**
   * Get reviews with filtering and pagination
   */
  getReviews(options: ReviewFilterOptions): Promise<PaginatedResult<ReviewWithDetails>>;

  /**
   * Get product review statistics
   */
  getProductReviewStatistics(productId: string): Promise<ReviewStatistics>;

  /**
   * Get products that can be reviewed by user
   */
  getReviewableProducts(
    userId: string,
  ): Promise<{ productId: string; orderId: string; orderDate: Date }[]>;
}
