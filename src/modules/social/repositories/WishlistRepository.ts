import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IWishlistRepository } from './WishlistRepository.interface';
import {
  Wishlist,
  WishlistWithDetails,
  WishlistPaginationResult,
  WishlistItemType,
} from '../models/Wishlist';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class WishlistRepository
  extends BasePrismaRepository<Wishlist, string>
  implements IWishlistRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'wishlist');
  }

  async addToWishlist(
    userId: string,
    itemType: WishlistItemType,
    itemId: string,
  ): Promise<Wishlist> {
    try {
      // Validate that the item exists and is available
      if (itemType === WishlistItemType.POST) {
        const post = await this.prisma.post.findFirst({
          where: {
            id: itemId,
            status: 'PUBLISHED',
            deletedAt: null,
          },
        });
        if (!post) {
          throw AppError.notFound('Post not found or not available');
        }
      } else if (itemType === WishlistItemType.PRODUCT) {
        const product = await this.prisma.product.findFirst({
          where: {
            id: itemId,
            status: 'PUBLISHED',
            deletedAt: null,
          },
        });
        if (!product) {
          throw AppError.notFound('Product not found or not available');
        }
      }

      // Check if item is already in wishlist
      const existing = await this.prisma.wishlist.findFirst({
        where: {
          userId,
          itemType,
          ...(itemType === WishlistItemType.POST ? { postId: itemId } : { productId: itemId }),
        },
      });

      if (existing) {
        return existing as Wishlist;
      }

      // Add to wishlist
      const wishlistItem = await this.prisma.wishlist.create({
        data: {
          userId,
          itemType,
          ...(itemType === WishlistItemType.POST ? { postId: itemId } : { productId: itemId }),
        },
      });

      return wishlistItem as Wishlist;
    } catch (error) {
      this.logger.error(`Error adding to wishlist: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to add to wishlist', 'DATABASE_ERROR');
    }
  }

  async removeFromWishlist(
    userId: string,
    itemType: WishlistItemType,
    itemId: string,
  ): Promise<boolean> {
    try {
      const result = await this.prisma.wishlist.deleteMany({
        where: {
          userId,
          itemType,
          ...(itemType === WishlistItemType.POST ? { postId: itemId } : { productId: itemId }),
        },
      });

      return result.count > 0;
    } catch (error) {
      this.logger.error(`Error removing from wishlist: ${error}`);
      return false;
    }
  }

  async hasInWishlist(
    userId: string,
    itemType: WishlistItemType,
    itemId: string,
  ): Promise<boolean> {
    try {
      const item = await this.prisma.wishlist.findFirst({
        where: {
          userId,
          itemType,
          ...(itemType === WishlistItemType.POST ? { postId: itemId } : { productId: itemId }),
        },
      });

      return !!item;
    } catch (error) {
      this.logger.error(`Error checking wishlist: ${error}`);
      return false;
    }
  }

  async toggleWishlistItem(
    userId: string,
    itemType: WishlistItemType,
    itemId: string,
  ): Promise<boolean> {
    try {
      const hasItem = await this.hasInWishlist(userId, itemType, itemId);

      if (hasItem) {
        await this.removeFromWishlist(userId, itemType, itemId);
        return false; // Item removed from wishlist
      } else {
        await this.addToWishlist(userId, itemType, itemId);
        return true; // Item added to wishlist
      }
    } catch (error) {
      this.logger.error(`Error toggling wishlist item: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to toggle wishlist item', 'DATABASE_ERROR');
    }
  }

  async getWishlistItems(
    userId: string,
    itemType?: WishlistItemType,
    page: number = 1,
    limit: number = 10,
  ): Promise<WishlistPaginationResult> {
    try {
      const where: any = { userId };
      if (itemType) {
        where.itemType = itemType;
      }

      const total = await this.prisma.wishlist.count({ where });

      const items = await this.prisma.wishlist.findMany({
        where,
        include: {
          product:
            itemType === WishlistItemType.PRODUCT || !itemType
              ? {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    images: true,
                    price: true,
                    discountPrice: true,
                    status: true,
                    avgRating: true,
                    reviewCount: true,
                    seller: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        artisanProfile: {
                          select: {
                            shopName: true,
                            isVerified: true,
                          },
                        },
                      },
                    },
                  },
                }
              : false,
          post:
            itemType === WishlistItemType.POST || !itemType
              ? {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    summary: true,
                    thumbnailUrl: true,
                    type: true,
                    createdAt: true,
                    user: {
                      select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        artisanProfile: {
                          select: {
                            shopName: true,
                            isVerified: true,
                          },
                        },
                      },
                    },
                  },
                }
              : false,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: items as WishlistWithDetails[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting wishlist items: ${error}`);
      throw AppError.internal('Failed to get wishlist items', 'DATABASE_ERROR');
    }
  }
}
