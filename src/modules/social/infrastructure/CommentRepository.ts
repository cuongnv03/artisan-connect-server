import { PrismaClient, Comment as PrismaComment, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { ICommentRepository } from '../domain/repositories/CommentRepository.interface';
import {
  Comment,
  CommentWithUser,
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryOptions,
  CommentPaginationResult,
} from '../domain/entities/Comment';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class CommentRepository
  extends BasePrismaRepository<Comment, string>
  implements ICommentRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'comment');
  }

  /**
   * Find comment by ID with user details
   */
  async findByIdWithUser(id: string, requestUserId?: string): Promise<CommentWithUser | null> {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id },
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
          // Include like status if requestUserId is provided
          likes: requestUserId
            ? {
                where: {
                  userId: requestUserId,
                },
              }
            : undefined,
        },
      });

      if (!comment) return null;

      // Transform to include like status
      const commentWithUser: CommentWithUser = {
        ...comment,
        liked: requestUserId ? comment.likes?.length > 0 : undefined,
      };

      // Remove prisma relation
      if (requestUserId) {
        delete (commentWithUser as any).likes;
      }

      return commentWithUser;
    } catch (error) {
      this.logger.error(`Error finding comment by ID: ${error}`);
      return null;
    }
  }

  /**
   * Create a comment
   */
  async createComment(userId: string, data: CreateCommentDto): Promise<CommentWithUser> {
    try {
      // Validate: Check if post exists
      const post = await this.prisma.post.findUnique({
        where: { id: data.postId },
        select: { id: true },
      });

      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      // If parentId is provided, validate parent comment
      if (data.parentId) {
        const parentComment = await this.prisma.comment.findUnique({
          where: { id: data.parentId },
          select: { id: true, postId: true },
        });

        if (!parentComment) {
          throw new AppError('Parent comment not found', 404, 'COMMENT_NOT_FOUND');
        }

        // Ensure parent comment belongs to the same post
        if (parentComment.postId !== data.postId) {
          throw new AppError('Parent comment does not belong to this post', 400, 'INVALID_PARENT');
        }
      }

      // Create comment in transaction to update counters
      const comment = await this.prisma.$transaction(async (tx) => {
        // Create the comment
        const comment = await tx.comment.create({
          data: {
            userId,
            postId: data.postId,
            parentId: data.parentId,
            content: data.content,
            mediaUrl: data.mediaUrl,
            likeCount: 0,
            replyCount: 0,
            isEdited: false,
          },
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
        });

        // Update post comment count
        await tx.post.update({
          where: { id: data.postId },
          data: { commentCount: { increment: 1 } },
        });

        // If this is a reply, update parent comment's reply count
        if (data.parentId) {
          await tx.comment.update({
            where: { id: data.parentId },
            data: { replyCount: { increment: 1 } },
          });
        }

        return comment;
      });

      return comment as unknown as CommentWithUser;
    } catch (error) {
      this.logger.error(`Error creating comment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create comment', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Update a comment
   */
  async updateComment(
    id: string,
    userId: string,
    data: UpdateCommentDto,
  ): Promise<CommentWithUser> {
    try {
      // Check if comment exists and belongs to user
      const comment = await this.prisma.comment.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!comment) {
        throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
      }

      if (comment.userId !== userId) {
        throw new AppError('You can only update your own comments', 403, 'FORBIDDEN');
      }

      // Update comment
      const updatedComment = await this.prisma.comment.update({
        where: { id },
        data: {
          content: data.content,
          mediaUrl: data.mediaUrl,
          isEdited: true,
        },
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
      });

      return updatedComment as unknown as CommentWithUser;
    } catch (error) {
      this.logger.error(`Error updating comment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update comment', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(id: string, userId: string): Promise<boolean> {
    try {
      // Check if comment exists
      const comment = await this.prisma.comment.findUnique({
        where: { id },
        select: { userId: true, postId: true, parentId: true },
      });

      if (!comment) {
        throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
      }

      // Check if user owns comment
      if (comment.userId !== userId) {
        // Check if user is post owner
        const post = await this.prisma.post.findUnique({
          where: { id: comment.postId },
          select: { userId: true },
        });

        if (!post || post.userId !== userId) {
          throw new AppError(
            'You can only delete your own comments or comments on your posts',
            403,
            'FORBIDDEN',
          );
        }
      }

      // Delete in transaction to update counters
      await this.prisma.$transaction(async (tx) => {
        // Soft delete the comment
        await tx.comment.update({
          where: { id },
          data: {
            content: '[Deleted comment]',
            mediaUrl: null,
            deletedAt: new Date(),
          },
        });

        // Update post comment count
        await tx.post.update({
          where: { id: comment.postId },
          data: { commentCount: { decrement: 1 } },
        });

        // If this is a reply, update parent comment's reply count
        if (comment.parentId) {
          await tx.comment.update({
            where: { id: comment.parentId },
            data: { replyCount: { decrement: 1 } },
          });
        }
      });

      return true;
    } catch (error) {
      this.logger.error(`Error deleting comment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete comment', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get comments
   */
  async getComments(
    options: CommentQueryOptions,
    requestUserId?: string,
  ): Promise<CommentPaginationResult> {
    try {
      const {
        postId,
        userId,
        parentId = null, // Null means get top-level comments only
        page = 1,
        limit = 10,
        includeLikeStatus = false,
        includeReplies = false,
        includeDeletedParent = false,
      } = options;

      // Build where clause
      const where: Prisma.CommentWhereInput = {
        deletedAt: null, // Don't include deleted comments
      };

      if (postId) {
        where.postId = postId;
      }

      if (userId) {
        where.userId = userId;
      }

      // Only get replies or top-level comments
      where.parentId = parentId;

      // Count total matching comments
      const total = await this.prisma.comment.count({ where });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Get comments
      const comments = await this.prisma.comment.findMany({
        where,
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
          likes:
            includeLikeStatus && requestUserId
              ? {
                  where: {
                    userId: requestUserId,
                  },
                }
              : undefined,
          // Optionally include replies
          replies: includeReplies
            ? {
                where: {
                  deletedAt: null,
                },
                take: 2, // Only get a few replies by default
                orderBy: {
                  createdAt: 'desc',
                },
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
                  likes:
                    includeLikeStatus && requestUserId
                      ? {
                          where: {
                            userId: requestUserId,
                          },
                        }
                      : undefined,
                },
              }
            : undefined,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      // Transform comments
      const transformedComments = comments.map((comment) => {
        // Add like status if requested
        const commentWithUser: CommentWithUser = {
          ...comment,
          liked: includeLikeStatus && requestUserId ? comment.likes?.length > 0 : undefined,
        };

        // Transform replies if included
        if (includeReplies && comment.replies) {
          commentWithUser.replies = comment.replies.map((reply) => {
            return {
              ...reply,
              liked: includeLikeStatus && requestUserId ? reply.likes?.length > 0 : undefined,
            };
          });

          // Remove Prisma relations from replies
          if (includeLikeStatus && requestUserId) {
            commentWithUser.replies.forEach((reply) => {
              delete (reply as any).likes;
            });
          }
        }

        // Remove Prisma relations
        if (includeLikeStatus && requestUserId) {
          delete (commentWithUser as any).likes;
        }

        return commentWithUser;
      });

      return {
        data: transformedComments,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting comments: ${error}`);
      throw new AppError('Failed to get comments', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get comment replies
   */
  async getCommentReplies(
    commentId: string,
    options: Omit<CommentQueryOptions, 'postId' | 'parentId'> = {},
    requestUserId?: string,
  ): Promise<CommentPaginationResult> {
    try {
      // Get parent comment first to get postId
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: commentId },
        select: { postId: true },
      });

      if (!parentComment) {
        throw new AppError('Parent comment not found', 404, 'COMMENT_NOT_FOUND');
      }

      // Set up options for getting replies
      const repliesOptions: CommentQueryOptions = {
        ...options,
        postId: parentComment.postId,
        parentId: commentId,
        includeLikeStatus: options.includeLikeStatus || false,
      };

      return this.getComments(repliesOptions, requestUserId);
    } catch (error) {
      this.logger.error(`Error getting comment replies: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get comment replies', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Increment comment reply count
   */
  async incrementReplyCount(commentId: string): Promise<void> {
    try {
      await this.prisma.comment.update({
        where: { id: commentId },
        data: { replyCount: { increment: 1 } },
      });
    } catch (error) {
      this.logger.error(`Error incrementing reply count: ${error}`);
      // Don't throw for counter updates
    }
  }

  /**
   * Decrement comment reply count
   */
  async decrementReplyCount(commentId: string): Promise<void> {
    try {
      await this.prisma.comment.update({
        where: { id: commentId },
        data: { replyCount: { decrement: 1 } },
      });
    } catch (error) {
      this.logger.error(`Error decrementing reply count: ${error}`);
      // Don't throw for counter updates
    }
  }

  /**
   * Check if comment belongs to user
   */
  async isCommentOwner(id: string, userId: string): Promise<boolean> {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id },
        select: { userId: true },
      });

      return !!comment && comment.userId === userId;
    } catch (error) {
      this.logger.error(`Error checking comment ownership: ${error}`);
      return false;
    }
  }
}
