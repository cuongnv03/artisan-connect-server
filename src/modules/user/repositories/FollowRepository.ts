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

      // Check if already following
      const existingFollow = await this.findByFollowerAndFollowing(followerId, followingId);
      if (existingFollow) {
        throw AppError.conflict('Already following this user', 'ALREADY_FOLLOWING');
      }

      // Create follow relationship in transaction
      return await this.prisma.$transaction(async (tx) => {
        // Create follow
        const follow = await tx.follow.create({
          data: {
            followerId,
            followingId,
            status: 'accepted',
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
      throw AppError.internal('Failed to remove follow relationship', 'DATABASE_ERROR');
    }
  }

  async getFollowers(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<FollowWithUser>> {
    try {
      const skip = (page - 1) * limit;

      // Get total count
      const total = await this.prisma.follow.count({
        where: { followingId: userId, status: 'accepted' },
      });

      // Get followers
      const follows = await this.prisma.follow.findMany({
        where: { followingId: userId, status: 'accepted' },
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

      // Get total count
      const total = await this.prisma.follow.count({
        where: { followerId: userId, status: 'accepted' },
      });

      // Get following
      const follows = await this.prisma.follow.findMany({
        where: { followerId: userId, status: 'accepted' },
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
      // Get follower and following counts
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          followerCount: true,
          followingCount: true,
        },
      });

      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      const stats: FollowStatsDto = {
        followersCount: user.followerCount,
        followingCount: user.followingCount,
      };

      // Check relationship with current user if provided
      if (currentUserId && currentUserId !== userId) {
        const isFollowing = await this.isFollowing(currentUserId, userId);
        const isFollowedBy = await this.isFollowing(userId, currentUserId);

        stats.isFollowing = isFollowing;
        stats.isFollowedBy = isFollowedBy;
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
      return follow !== null && follow.status === 'accepted';
    } catch (error) {
      this.logger.error(`Error checking if following: ${error}`);
      return false;
    }
  }

  async updateFollowCounts(userId: string): Promise<void> {
    try {
      // Recalculate follower and following counts
      const [followerCount, followingCount] = await Promise.all([
        this.prisma.follow.count({
          where: { followingId: userId, status: 'accepted' },
        }),
        this.prisma.follow.count({
          where: { followerId: userId, status: 'accepted' },
        }),
      ]);

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
