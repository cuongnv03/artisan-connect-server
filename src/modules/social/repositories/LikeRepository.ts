import { PrismaClient, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { ILikeRepository } from './LikeRepository.interface';
import { Like, LikeWithUser, LikePaginationResult } from '../models/Like';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class LikeRepository extends BasePrismaRepository<Like, string> implements ILikeRepository {
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'like');
  }

  async createLike(userId: string, data: { postId?: string; commentId?: string }): Promise<Like> {
    try {
      // Validate input
      if ((!data.postId && !data.commentId) || (data.postId && data.commentId)) {
        throw new AppError(
          'Must provide either postId or commentId, but not both',
          400,
          'INVALID_INPUT',
        );
      }

      // Check if already liked
      const existingLike = await this.getLike(userId, data);
      if (existingLike) {
        throw new AppError('Already liked this item', 409, 'ALREADY_LIKED');
      }

      // Create like and update counters in transaction
      const like = await this.prisma.$transaction(async (tx) => {
        const like = await tx.like.create({
          data: {
            userId,
            postId: data.postId,
            commentId: data.commentId,
            reaction: 'like', // Fixed value since we only have one type
          },
        });

        // Update like count
        if (data.postId) {
          await tx.post.update({
            where: { id: data.postId },
            data: { likeCount: { increment: 1 } },
          });
        } else if (data.commentId) {
          await tx.comment.update({
            where: { id: data.commentId },
            data: { likeCount: { increment: 1 } },
          });
        }

        return like;
      });

      return like as Like;
    } catch (error) {
      this.logger.error(`Error creating like: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create like', 500, 'DATABASE_ERROR');
    }
  }

  async deleteLike(
    userId: string,
    data: { postId?: string; commentId?: string },
  ): Promise<boolean> {
    try {
      // Validate input
      if ((!data.postId && !data.commentId) || (data.postId && data.commentId)) {
        throw new AppError(
          'Must provide either postId or commentId, but not both',
          400,
          'INVALID_INPUT',
        );
      }

      // Find and delete like with counter update
      const result = await this.prisma.$transaction(async (tx) => {
        const like = await tx.like.findFirst({
          where: {
            userId,
            postId: data.postId,
            commentId: data.commentId,
          },
        });

        if (!like) return false;

        await tx.like.delete({
          where: { id: like.id },
        });

        // Update like count
        if (data.postId) {
          await tx.post.update({
            where: { id: data.postId },
            data: { likeCount: { decrement: 1 } },
          });
        } else if (data.commentId) {
          await tx.comment.update({
            where: { id: data.commentId },
            data: { likeCount: { decrement: 1 } },
          });
        }

        return true;
      });

      return result;
    } catch (error) {
      this.logger.error(`Error deleting like: ${error}`);
      if (error instanceof AppError) throw error;
      return false;
    }
  }

  async getLike(
    userId: string,
    data: { postId?: string; commentId?: string },
  ): Promise<Like | null> {
    try {
      const like = await this.prisma.like.findFirst({
        where: {
          userId,
          postId: data.postId,
          commentId: data.commentId,
        },
      });

      return like as Like | null;
    } catch (error) {
      this.logger.error(`Error getting like: ${error}`);
      return null;
    }
  }

  async hasLiked(userId: string, data: { postId?: string; commentId?: string }): Promise<boolean> {
    try {
      const like = await this.getLike(userId, data);
      return !!like;
    } catch (error) {
      return false;
    }
  }

  async getPostLikes(
    postId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<LikePaginationResult> {
    try {
      const total = await this.prisma.like.count({
        where: { postId },
      });

      const likes = await this.prisma.like.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: likes as unknown as LikeWithUser[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting post likes: ${error}`);
      throw new AppError('Failed to get post likes', 500, 'DATABASE_ERROR');
    }
  }

  async getCommentLikes(
    commentId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<LikePaginationResult> {
    try {
      const total = await this.prisma.like.count({
        where: { commentId },
      });

      const likes = await this.prisma.like.findMany({
        where: { commentId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: likes as unknown as LikeWithUser[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting comment likes: ${error}`);
      throw new AppError('Failed to get comment likes', 500, 'DATABASE_ERROR');
    }
  }

  async getLikesCount(data: { postId?: string; commentId?: string }): Promise<number> {
    try {
      return await this.prisma.like.count({
        where: {
          postId: data.postId,
          commentId: data.commentId,
        },
      });
    } catch (error) {
      this.logger.error(`Error getting likes count: ${error}`);
      return 0;
    }
  }
}
