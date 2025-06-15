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

  async getReviews(options: ReviewFilterOptions): Promise<PaginatedResult<ReviewWithDetails>> {
    try {
      const {
        productId,
        userId,
        rating,
        isVerifiedPurchase,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
      } = options;

      const where: any = {};

      if (productId) where.productId = productId;
      if (userId) where.userId = userId;
      if (rating) where.rating = rating;
      if (isVerifiedPurchase !== undefined) where.isVerifiedPurchase = isVerifiedPurchase;

      const total = await this.prisma.review.count({ where });
      const skip = (page - 1) * limit;
      const orderBy = { [sortBy]: sortOrder };

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

  async getProductReviewStatistics(productId: string): Promise<ReviewStatistics> {
    try {
      const [allReviews, verifiedCount] = await Promise.all([
        this.prisma.review.findMany({
          where: { productId },
          select: { rating: true },
        }),
        this.prisma.review.count({
          where: { productId, isVerifiedPurchase: true },
        }),
      ]);

      const totalReviews = allReviews.length;
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      let sum = 0;
      allReviews.forEach((review) => {
        sum += review.rating;
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      });

      const averageRating = totalReviews > 0 ? sum / totalReviews : 0;

      return {
        totalReviews,
        averageRating,
        verifiedPurchaseCount: verifiedCount,
        ratingDistribution,
      };
    } catch (error) {
      this.logger.error(`Error getting product review statistics: ${error}`);
      throw new AppError('Failed to get review statistics', 500, 'DATABASE_ERROR');
    }
  }

  async createReview(
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

      // Check if user purchased the product (simple check)
      const hasPurchased = await this.hasUserPurchasedProduct(userId, productId);

      const newReview = await this.prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
          data: {
            userId,
            productId,
            rating,
            title,
            comment,
            images: images || [],
            helpfulCount: 0,
            isVerifiedPurchase: hasPurchased,
            orderItemId: null, // Keep simple
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

        // Update product stats
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

  async updateReview(
    id: string,
    userId: string,
    data: Partial<Review>,
  ): Promise<ReviewWithDetails> {
    try {
      const review = await this.prisma.review.findUnique({
        where: { id },
      });

      if (!review) {
        throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
      }

      if (review.userId !== userId) {
        throw new AppError('You can only update your own reviews', 403, 'FORBIDDEN');
      }

      const updatedReview = await this.prisma.$transaction(async (tx) => {
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

  async deleteReview(id: string, userId: string): Promise<boolean> {
    try {
      const review = await this.prisma.review.findUnique({
        where: { id },
      });

      if (!review) {
        throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
      }

      if (review.userId !== userId) {
        throw new AppError('You can only delete your own reviews', 403, 'FORBIDDEN');
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.review.delete({
          where: { id },
        });

        await this.updateProductRatingAndReviewCount(review.productId);
      });

      return true;
    } catch (error) {
      this.logger.error(`Error deleting review: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete review', 500, 'DATABASE_ERROR');
    }
  }

  async getReviewableProducts(
    userId: string,
  ): Promise<{ productId: string; orderId: string; orderDate: Date }[]> {
    try {
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

      const purchasedProducts: { productId: string; orderId: string; orderDate: Date }[] = [];

      for (const order of orders) {
        for (const item of order.items) {
          if (!item.productId) continue; // Skip custom orders

          const existingReview = await this.prisma.review.findUnique({
            where: {
              userId_productId: {
                userId,
                productId: item.productId,
              },
            },
          });

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

  async updateProductRatingAndReviewCount(productId: string): Promise<void> {
    try {
      const stats = await this.getProductReviewStatistics(productId);

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
