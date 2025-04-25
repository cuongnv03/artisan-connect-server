import { PrismaClient, Follow as PrismaFollow, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IFollowRepository } from './FollowRepository.interface';
import {
  Follow,
  FollowWithDetails,
  FollowStatus,
  FollowQueryOptions,
  FollowPaginationResult,
} from '../models/Follow';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class FollowRepository
  extends BasePrismaRepository<Follow, string>
  implements IFollowRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'follow');
  }

  /**
   * Create follow relationship
   */
  async createFollow(
    followerId: string,
    followingId: string,
    notifyNewPosts: boolean = true,
  ): Promise<Follow> {
    try {
      // Check if users are the same
      if (followerId === followingId) {
        throw new AppError('Users cannot follow themselves', 400, 'INVALID_FOLLOW');
      }

      // Check if follow already exists
      const existing = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (existing) {
        throw new AppError('Already following this user', 409, 'ALREADY_FOLLOWING');
      }

      // Check if users exist
      const [follower, following] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: followerId } }),
        this.prisma.user.findUnique({ where: { id: followingId } }),
      ]);

      if (!follower || !following) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Create follow relationship
      const follow = await this.prisma.$transaction(async (tx) => {
        // Create follow
        const follow = await tx.follow.create({
          data: {
            followerId,
            followingId,
            notifyNewPosts,
            status: FollowStatus.ACCEPTED, // Default to accepted
          },
        });

        // Update follower counts
        await tx.user.update({
          where: { id: followerId },
          data: { followingCount: { increment: 1 } },
        });

        await tx.user.update({
          where: { id: followingId },
          data: { followerCount: { increment: 1 } },
        });

        return follow;
      });

      return follow as Follow;
    } catch (error) {
      this.logger.error(`Error creating follow: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create follow relationship', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Delete follow relationship
   */
  async removeFollow(followerId: string, followingId: string): Promise<boolean> {
    try {
      // Check if follow exists
      const follow = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (!follow) {
        throw new AppError('Follow relationship not found', 404, 'FOLLOW_NOT_FOUND');
      }

      // Remove follow in transaction to update counts
      await this.prisma.$transaction(async (tx) => {
        // Delete follow
        await tx.follow.delete({
          where: {
            followerId_followingId: {
              followerId,
              followingId,
            },
          },
        });

        // Update follower counts
        await tx.user.update({
          where: { id: followerId },
          data: { followingCount: { decrement: 1 } },
        });

        await tx.user.update({
          where: { id: followingId },
          data: { followerCount: { decrement: 1 } },
        });
      });

      return true;
    } catch (error) {
      this.logger.error(`Error removing follow: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to remove follow relationship', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Update follow status
   */
  async updateFollowStatus(id: string, status: FollowStatus): Promise<Follow> {
    try {
      const follow = await this.prisma.follow.update({
        where: { id },
        data: { status },
      });

      return follow as Follow;
    } catch (error) {
      this.logger.error(`Error updating follow status: ${error}`);
      throw new AppError('Failed to update follow status', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Update notification preference
   */
  async updateNotificationPreference(
    followerId: string,
    followingId: string,
    notify: boolean,
  ): Promise<Follow> {
    try {
      const follow = await this.prisma.follow.update({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
        data: { notifyNewPosts: notify },
      });

      return follow as Follow;
    } catch (error) {
      this.logger.error(`Error updating notification preference: ${error}`);
      if ((error as any).code === 'P2025') {
        throw new AppError('Follow relationship not found', 404, 'FOLLOW_NOT_FOUND');
      }
      throw new AppError('Failed to update notification preference', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Check if follow relationship exists
   */
  async checkFollowExists(followerId: string, followingId: string): Promise<Follow | null> {
    try {
      const follow = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      return follow as Follow | null;
    } catch (error) {
      this.logger.error(`Error checking follow: ${error}`);
      return null;
    }
  }

  /**
   * Get follow relationship with details
   */
  async getFollow(followerId: string, followingId: string): Promise<FollowWithDetails | null> {
    try {
      const follow = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
        include: {
          follower: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
              artisanProfile: {
                select: {
                  shopName: true,
                },
              },
            },
          },
          following: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
              artisanProfile: {
                select: {
                  shopName: true,
                },
              },
            },
          },
        },
      });

      return follow as unknown as FollowWithDetails | null;
    } catch (error) {
      this.logger.error(`Error getting follow: ${error}`);
      return null;
    }
  }

  /**
   * Get followers with pagination
   */
  async getFollowers(
    userId: string,
    options?: FollowQueryOptions,
  ): Promise<FollowPaginationResult> {
    try {
      const { status = FollowStatus.ACCEPTED, page = 1, limit = 10 } = options || {};

      // Build query
      const where: Prisma.FollowWhereInput = {
        followingId: userId,
        status,
      };

      // Count total followers
      const total = await this.prisma.follow.count({ where });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Get followers
      const followers = await this.prisma.follow.findMany({
        where,
        include: {
          follower: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
              artisanProfile: {
                select: {
                  shopName: true,
                },
              },
            },
          },
          following: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
              artisanProfile: {
                select: {
                  shopName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: followers as unknown as FollowWithDetails[],
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting followers: ${error}`);
      throw new AppError('Failed to get followers', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get following with pagination
   */
  async getFollowing(
    userId: string,
    options?: FollowQueryOptions,
  ): Promise<FollowPaginationResult> {
    try {
      const { status = FollowStatus.ACCEPTED, page = 1, limit = 10 } = options || {};

      // Build query
      const where: Prisma.FollowWhereInput = {
        followerId: userId,
        status,
      };

      // Count total following
      const total = await this.prisma.follow.count({ where });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Get following
      const following = await this.prisma.follow.findMany({
        where,
        include: {
          follower: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
              artisanProfile: {
                select: {
                  shopName: true,
                },
              },
            },
          },
          following: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
              artisanProfile: {
                select: {
                  shopName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: following as unknown as FollowWithDetails[],
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting following: ${error}`);
      throw new AppError('Failed to get following', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get follow count
   */
  async getFollowCount(userId: string): Promise<{ followerCount: number; followingCount: number }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { followerCount: true, followingCount: true },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      return {
        followerCount: user.followerCount,
        followingCount: user.followingCount,
      };
    } catch (error) {
      this.logger.error(`Error getting follow count: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get follow count', 500, 'DATABASE_ERROR');
    }
  }
}
