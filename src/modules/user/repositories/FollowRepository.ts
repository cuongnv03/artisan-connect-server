import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IFollowRepository } from './FollowRepository.interface';
import { Follow, FollowWithUser, FollowStatsDto } from '../models/Follow';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
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

  async findByFollowerAndFollowing(
    followerId: string,
    followingId: string,
  ): Promise<Follow | null> {
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
      this.logger.error(`Error finding follow relationship: ${error}`);
      return null;
    }
  }

  async createFollow(followerId: string, followingId: string): Promise<Follow> {
    try {
      if (followerId === followingId) {
        throw AppError.badRequest('Cannot follow yourself', 'SELF_FOLLOW');
      }

      // BUSINESS RULE: Check that the person being followed is an ARTISAN
      const followingUser = await this.prisma.user.findUnique({
        where: { id: followingId },
        select: { id: true, role: true },
      });

      if (!followingUser) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      if (followingUser.role !== 'ARTISAN') {
        throw AppError.badRequest('You can only follow artisans', 'INVALID_FOLLOW_TARGET');
      }

      // Check if already following
      const existingFollow = await this.findByFollowerAndFollowing(followerId, followingId);
      if (existingFollow) {
        this.logger.info(`User ${followerId} already follows artisan ${followingId}`);
        return existingFollow;
      }

      // Create follow relationship in transaction
      return await this.prisma.$transaction(async (tx) => {
        // Create follow
        const follow = await tx.follow.create({
          data: {
            followerId,
            followingId,
          },
        });

        // Update follow counts - CHỈ CẬP NHẬT ARTISAN FOLLOWER COUNT
        await tx.user.update({
          where: { id: followerId },
          data: { followingCount: { increment: 1 } },
        });

        // Chỉ cập nhật followerCount cho ARTISAN
        await tx.user.update({
          where: {
            id: followingId,
            role: 'ARTISAN', // Đảm bảo chỉ ARTISAN mới có follower count
          },
          data: { followerCount: { increment: 1 } },
        });

        return follow as Follow;
      });
    } catch (error) {
      this.logger.error(`Error creating follow: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to create follow relationship', 'DATABASE_ERROR');
    }
  }

  async removeFollow(followerId: string, followingId: string): Promise<boolean> {
    try {
      const existingFollow = await this.findByFollowerAndFollowing(followerId, followingId);
      if (!existingFollow) {
        return false;
      }

      // Remove follow relationship in transaction
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

        // Update follow counts
        await tx.user.update({
          where: { id: followerId },
          data: { followingCount: { decrement: 1 } },
        });

        // Chỉ cập nhật followerCount cho ARTISAN
        await tx.user.update({
          where: {
            id: followingId,
            role: 'ARTISAN',
          },
          data: { followerCount: { decrement: 1 } },
        });
      });

      return true;
    } catch (error) {
      this.logger.error(`Error removing follow: ${error}`);
      throw AppError.internal('Failed to remove follow relationship', 'DATABASE_ERROR');
    }
  }

  async getFollowers(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<FollowWithUser>> {
    try {
      // BUSINESS RULE: Chỉ ARTISAN mới có followers
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || user.role !== 'ARTISAN') {
        throw AppError.forbidden('Only artisans have followers', 'INVALID_OPERATION');
      }

      const skip = (page - 1) * limit;

      // Get total count
      const total = await this.prisma.follow.count({
        where: { followingId: userId },
      });

      // Get followers
      const follows = await this.prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          following: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      return {
        data: follows as FollowWithUser[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting followers: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get followers', 'DATABASE_ERROR');
    }
  }

  async getFollowing(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<FollowWithUser>> {
    try {
      const skip = (page - 1) * limit;

      // Get total count - user theo dõi các ARTISAN
      const total = await this.prisma.follow.count({
        where: {
          followerId: userId,
          following: {
            role: 'ARTISAN', // Chỉ đếm những artisan được follow
          },
        },
      });

      // Get following - chỉ lấy ARTISAN
      const follows = await this.prisma.follow.findMany({
        where: {
          followerId: userId,
          following: {
            role: 'ARTISAN',
          },
        },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          following: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      return {
        data: follows as FollowWithUser[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting following: ${error}`);
      throw AppError.internal('Failed to get following', 'DATABASE_ERROR');
    }
  }

  async getFollowStats(userId: string, currentUserId?: string): Promise<FollowStatsDto> {
    try {
      // Get user để check role
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          followerCount: true,
          followingCount: true,
        },
      });

      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      const stats: FollowStatsDto = {
        // CHỈ ARTISAN mới có follower count
        followersCount: user.role === 'ARTISAN' ? user.followerCount : 0,
        followingCount: user.followingCount,
      };

      // Check relationship with current user if provided
      if (currentUserId && currentUserId !== userId) {
        // Chỉ check isFollowing nếu target user là ARTISAN
        if (user.role === 'ARTISAN') {
          const isFollowing = await this.isFollowing(currentUserId, userId);
          stats.isFollowing = isFollowing;
        }

        // Chỉ check isFollowedBy nếu current user là ARTISAN
        const currentUser = await this.prisma.user.findUnique({
          where: { id: currentUserId },
          select: { role: true },
        });

        if (currentUser?.role === 'ARTISAN') {
          const isFollowedBy = await this.isFollowing(userId, currentUserId);
          stats.isFollowedBy = isFollowedBy;
        }
      }

      return stats;
    } catch (error) {
      this.logger.error(`Error getting follow stats: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get follow stats', 'DATABASE_ERROR');
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const follow = await this.findByFollowerAndFollowing(followerId, followingId);
      return follow !== null;
    } catch (error) {
      this.logger.error(`Error checking if following: ${error}`);
      return false;
    }
  }

  async updateFollowCounts(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      // Recalculate following count (cho tất cả users)
      const followingCount = await this.prisma.follow.count({
        where: {
          followerId: userId,
          following: { role: 'ARTISAN' }, // Chỉ đếm artisan được follow
        },
      });

      // Recalculate follower count CHỈ CHO ARTISAN
      let followerCount = 0;
      if (user?.role === 'ARTISAN') {
        followerCount = await this.prisma.follow.count({
          where: { followingId: userId },
        });
      }

      // Update user counts
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          followerCount,
          followingCount,
        },
      });
    } catch (error) {
      this.logger.error(`Error updating follow counts: ${error}`);
      throw AppError.internal('Failed to update follow counts', 'DATABASE_ERROR');
    }
  }
}
