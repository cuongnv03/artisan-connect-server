import { PrismaClient, Like as PrismaLike, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { ILikeRepository } from './LikeRepository.interface';
import { Like, LikeWithUser, LikePaginationResult, ReactionType } from '../models/Like';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class LikeRepository extends BasePrismaRepository<Like, string> implements ILikeRepository {
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'like');
  }

  /**
   * Create a like
   */
  async createLike(
    userId: string,
    data: { postId?: string; commentId?: string; reaction?: ReactionType },
  ): Promise<Like> {
    try {
      // Validate: must provide either postId or commentId but not both
      if ((!data.postId && !data.commentId) || (data.postId && data.commentId)) {
        throw new AppError('Must provide either postId or commentId', 400, 'INVALID_LIKE');
      }

      // Check if user has already liked this post/comment
      const existingLike = await this.getLike(userId, {
        postId: data.postId,
        commentId: data.commentId,
      });

      if (existingLike) {
        throw new AppError('Already liked this item', 409, 'ALREADY_LIKED');
      }

      // Create like in transaction to update counter
      const like = await this.prisma.$transaction(async (tx) => {
        // Create like
        const like = await tx.like.create({
          data: {
            userId,
            postId: data.postId,
            commentId: data.commentId,
            reaction: data.reaction || ReactionType.LIKE,
          },
        });

        // Update like count on post or comment
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

  /**
   * Delete a like
   */
  async deleteLike(
    userId: string,
    data: { postId?: string; commentId?: string },
  ): Promise<boolean> {
    try {
      // Validate: must provide either postId or commentId but not both
      if ((!data.postId && !data.commentId) || (data.postId && data.commentId)) {
        throw new AppError('Must provide either postId or commentId', 400, 'INVALID_LIKE');
      }

      // Find the like
      const where: Prisma.LikeWhereUniqueInput = {
        userId_postId: data.postId ? { userId, postId: data.postId } : undefined,
        userId_commentId: data.commentId ? { userId, commentId: data.commentId } : undefined,
      };

      // Delete in transaction to update counter
      await this.prisma.$transaction(async (tx) => {
        // Find the like first
        const like = await tx.like.findUnique({ where });

        if (!like) {
          throw new AppError('Like not found', 404, 'LIKE_NOT_FOUND');
        }

        // Delete the like
        await tx.like.delete({ where });

        // Update like count on post or comment
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
      });

      return true;
    } catch (error) {
      this.logger.error(`Error deleting like: ${error}`);
      if (error instanceof AppError) throw error;
      if ((error as any).code === 'P2025') {
        // Record not found
        return false;
      }
      throw new AppError('Failed to delete like', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get like by user and post or comment
   */
  async getLike(
    userId: string,
    data: { postId?: string; commentId?: string },
  ): Promise<Like | null> {
    try {
      // Validate: must provide either postId or commentId but not both
      if ((!data.postId && !data.commentId) || (data.postId && data.commentId)) {
        throw new AppError('Must provide either postId or commentId', 400, 'INVALID_LIKE');
      }

      // Build where clause
      const where: Prisma.LikeWhereUniqueInput = {
        userId_postId: data.postId ? { userId, postId: data.postId } : undefined,
        userId_commentId: data.commentId ? { userId, commentId: data.commentId } : undefined,
      };

      const like = await this.prisma.like.findUnique({ where });
      return like as Like | null;
    } catch (error) {
      this.logger.error(`Error getting like: ${error}`);
      if (error instanceof AppError) throw error;
      return null;
    }
  }

  /**
   * Check if user has liked
   */
  async hasLiked(userId: string, data: { postId?: string; commentId?: string }): Promise<boolean> {
    try {
      const like = await this.getLike(userId, data);
      return !!like;
    } catch (error) {
      this.logger.error(`Error checking if liked: ${error}`);
      return false;
    }
  }

  /**
   * Get likes for a post
   */
  async getPostLikes(
    postId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<LikePaginationResult> {
    try {
      // Count total likes
      const total = await this.prisma.like.count({
        where: { postId },
      });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Get likes with user info
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
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting post likes: ${error}`);
      throw new AppError('Failed to get post likes', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get likes for a comment
   */
  async getCommentLikes(
    commentId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<LikePaginationResult> {
    try {
      // Count total likes
      const total = await this.prisma.like.count({
        where: { commentId },
      });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Get likes with user info
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
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting comment likes: ${error}`);
      throw new AppError('Failed to get comment likes', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get likes count
   */
  async getLikesCount(data: { postId?: string; commentId?: string }): Promise<number> {
    try {
      // Validate: must provide either postId or commentId but not both
      if ((!data.postId && !data.commentId) || (data.postId && data.commentId)) {
        throw new AppError('Must provide either postId or commentId', 400, 'INVALID_LIKE');
      }

      // Build where clause
      const where: Prisma.LikeWhereInput = data.postId
        ? { postId: data.postId }
        : { commentId: data.commentId };

      return await this.prisma.like.count({ where });
    } catch (error) {
      this.logger.error(`Error getting likes count: ${error}`);
      if (error instanceof AppError) throw error;
      return 0;
    }
  }
}
