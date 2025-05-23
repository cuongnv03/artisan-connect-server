import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IReviewRepository } from './ReviewRepository.interface';
import { Review, ReviewWithDetails, ReviewStatistics, ReviewFilterOptions } from '../models/Review';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { OrderStatus } from '../../order/models/OrderEnums';

export class ReviewRepository
  extends BasePrismaRepository<Review, string>
  implements IReviewRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'review');
  }

  /**
   * Find review by ID with details
   */
  async findByIdWithDetails(id: string): Promise<ReviewWithDetails | null> {
    try {
      const review = await this.prisma.review.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              price: true,
              discountPrice: true,
            },
          },
        },
      });

      if (!review) return null;

      return {
        ...review,
        product: {
          ...review.product,
          price: Number(review.product.price),
          discountPrice: review.product.discountPrice ? Number(review.product.discountPrice) : null,
        },
      } as ReviewWithDetails;
    } catch (error) {
      this.logger.error(`Error finding review by ID: ${error}`);
      return null;
    }
  }

  /**
   * Find review by user and product
   */
  async findByUserAndProduct(userId: string, productId: string): Promise<ReviewWithDetails | null> {
    try {
      const review = await this.prisma.review.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              price: true,
              discountPrice: true,
            },
          },
        },
      });

      if (!review) return null;

      return {
        ...review,
        product: {
          ...review.product,
          price: Number(review.product.price),
          discountPrice: review.product.discountPrice ? Number(review.product.discountPrice) : null,
        },
      } as ReviewWithDetails;
    } catch (error) {
      this.logger.error(`Error finding review by user and product: ${error}`);
      return null;
    }
  }

  /**
   * Get reviews with filtering and pagination
   */
  async getReviews(options: ReviewFilterOptions): Promise<PaginatedResult<ReviewWithDetails>> {
    try {
      const {
        productId,
        userId,
        rating,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
      } = options;

      // Build where clause
      const where: any = {};

      if (productId) {
        where.productId = productId;
      }

      if (userId) {
        where.userId = userId;
      }

      if (rating) {
        where.rating = rating;
      }

      // Count total reviews
      const total = await this.prisma.review.count({ where });

      // Calculate skip
      const skip = (page - 1) * limit;

      // Build order by
      const orderBy = { [sortBy]: sortOrder };

      // Get reviews
      const reviews = await this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              price: true,
              discountPrice: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      });

      const transformedReviews = reviews.map((review) => ({
        ...review,
        product: {
          ...review.product,
          price: Number(review.product.price),
          discountPrice: review.product.discountPrice ? Number(review.product.discountPrice) : null,
        },
      })) as ReviewWithDetails[];

      return {
        data: transformedReviews,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting reviews: ${error}`);
      throw new AppError('Failed to get reviews', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get product review statistics
   */
  async getProductReviewStatistics(productId: string): Promise<ReviewStatistics> {
    try {
      const reviews = await this.prisma.review.findMany({
        where: { productId },
        select: { rating: true },
      });

      const totalReviews = reviews.length;

      // Initialize rating distribution
      const ratingDistribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      // Calculate total ratings and distribution
      let sum = 0;
      reviews.forEach((review) => {
        sum += review.rating;
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      });

      // Calculate average rating
      const averageRating = totalReviews > 0 ? sum / totalReviews : 0;

      return {
        totalReviews,
        averageRating,
        ratingDistribution,
      };
    } catch (error) {
      this.logger.error(`Error getting product review statistics: ${error}`);
      throw new AppError('Failed to get review statistics', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Create review
   */
  async createReview(
    userId: string,
    data: Omit<Review, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ): Promise<ReviewWithDetails> {
    try {
      const { productId, rating, title, comment, images } = data;

      // Check if review already exists
      const existingReview = await this.findByUserAndProduct(userId, productId);

      if (existingReview) {
        throw new AppError('You have already reviewed this product', 409, 'REVIEW_ALREADY_EXISTS');
      }

      // Verify product exists
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      // Create review in a transaction
      const newReview = await this.prisma.$transaction(async (tx) => {
        // Create the review
        const review = await tx.review.create({
          data: {
            userId,
            productId,
            rating,
            title,
            comment,
            images: images || [],
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                price: true,
                discountPrice: true,
              },
            },
          },
        });

        // Update product avg rating and review count
        await this.updateProductRatingAndReviewCount(productId);

        return review;
      });

      return {
        ...newReview,
        product: {
          ...newReview.product,
          price: Number(newReview.product.price),
          discountPrice: newReview.product.discountPrice
            ? Number(newReview.product.discountPrice)
            : null,
        },
      } as ReviewWithDetails;
    } catch (error) {
      this.logger.error(`Error creating review: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create review', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Update review
   */
  async updateReview(
    id: string,
    userId: string,
    data: Partial<Review>,
  ): Promise<ReviewWithDetails> {
    try {
      // Verify review exists and belongs to user
      const review = await this.prisma.review.findUnique({
        where: { id },
      });

      if (!review) {
        throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
      }

      if (review.userId !== userId) {
        throw new AppError('You can only update your own reviews', 403, 'FORBIDDEN');
      }

      // Update review in a transaction
      const updatedReview = await this.prisma.$transaction(async (tx) => {
        // Update the review
        const updated = await tx.review.update({
          where: { id },
          data: {
            rating: data.rating,
            title: data.title,
            comment: data.comment,
            images: data.images,
            updatedAt: new Date(),
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                price: true,
                discountPrice: true,
              },
            },
          },
        });

        // Update product avg rating if rating changed
        if (data.rating && data.rating !== review.rating) {
          await this.updateProductRatingAndReviewCount(review.productId);
        }

        return updated;
      });

      return {
        ...updatedReview,
        product: {
          ...updatedReview.product,
          price: Number(updatedReview.product.price),
          discountPrice: updatedReview.product.discountPrice
            ? Number(updatedReview.product.discountPrice)
            : null,
        },
      } as ReviewWithDetails;
    } catch (error) {
      this.logger.error(`Error updating review: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update review', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Delete review
   */
  async deleteReview(id: string, userId: string): Promise<boolean> {
    try {
      // Verify review exists and belongs to user
      const review = await this.prisma.review.findUnique({
        where: { id },
      });

      if (!review) {
        throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
      }

      if (review.userId !== userId) {
        throw new AppError('You can only delete your own reviews', 403, 'FORBIDDEN');
      }

      // Delete review in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Delete the review
        await tx.review.delete({
          where: { id },
        });

        // Update product avg rating and review count
        await this.updateProductRatingAndReviewCount(review.productId);
      });

      return true;
    } catch (error) {
      this.logger.error(`Error deleting review: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete review', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get products purchased by user that can be reviewed
   */
  async getReviewableProducts(
    userId: string,
  ): Promise<{ productId: string; orderId: string; orderDate: Date }[]> {
    try {
      // Get delivered orders for this user
      const orders = await this.prisma.order.findMany({
        where: {
          userId,
          status: OrderStatus.DELIVERED,
        },
        select: {
          id: true,
          createdAt: true,
          items: {
            select: {
              productId: true,
            },
          },
        },
      });

      // Get products from these orders
      const purchasedProducts: { productId: string; orderId: string; orderDate: Date }[] = [];

      for (const order of orders) {
        for (const item of order.items) {
          // Check if user already reviewed this product
          const existingReview = await this.prisma.review.findUnique({
            where: {
              userId_productId: {
                userId,
                productId: item.productId,
              },
            },
          });

          // If not reviewed yet, add to reviewable products
          if (!existingReview) {
            purchasedProducts.push({
              productId: item.productId,
              orderId: order.id,
              orderDate: order.createdAt,
            });
          }
        }
      }

      return purchasedProducts;
    } catch (error) {
      this.logger.error(`Error getting reviewable products: ${error}`);
      throw new AppError('Failed to get reviewable products', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Update product rating and review count
   */
  async updateProductRatingAndReviewCount(productId: string): Promise<void> {
    try {
      // Get product review statistics
      const stats = await this.getProductReviewStatistics(productId);

      // Update product
      await this.prisma.product.update({
        where: { id: productId },
        data: {
          avgRating: stats.averageRating,
          reviewCount: stats.totalReviews,
        },
      });
    } catch (error) {
      this.logger.error(`Error updating product rating and review count: ${error}`);
      throw new AppError('Failed to update product rating', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Check if user has purchased product
   */
  async hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    try {
      const orderItem = await this.prisma.orderItem.findFirst({
        where: {
          productId,
          order: {
            userId,
            status: OrderStatus.DELIVERED,
          },
        },
      });

      return !!orderItem;
    } catch (error) {
      this.logger.error(`Error checking if user has purchased product: ${error}`);
      return false;
    }
  }
}
