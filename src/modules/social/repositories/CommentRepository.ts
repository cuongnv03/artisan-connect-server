import { PrismaClient, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { ICommentRepository } from './CommentRepository.interface';
import {
  Comment,
  CommentWithUser,
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryOptions,
  CommentPaginationResult,
} from '../models/Comment';
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

  async findByIdWithUser(id: string, requestUserId?: string): Promise<CommentWithUser | null> {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id, deletedAt: null },
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
          likes: requestUserId
            ? {
                where: { userId: requestUserId },
              }
            : undefined,
        },
      });

      if (!comment) return null;

      return this.transformCommentWithUser(comment, requestUserId);
    } catch (error) {
      this.logger.error(`Error finding comment by ID: ${error}`);
      return null;
    }
  }

  async createComment(userId: string, data: CreateCommentDto): Promise<CommentWithUser> {
    try {
      // Validate post exists
      const post = await this.prisma.post.findUnique({
        where: { id: data.postId, deletedAt: null },
        select: { id: true },
      });

      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      // If parentId provided, validate parent comment exists and belongs to same post
      if (data.parentId) {
        const parentComment = await this.prisma.comment.findUnique({
          where: { id: data.parentId, deletedAt: null },
          select: { id: true, postId: true },
        });

        if (!parentComment) {
          throw new AppError('Parent comment not found', 404, 'COMMENT_NOT_FOUND');
        }

        if (parentComment.postId !== data.postId) {
          throw new AppError('Parent comment does not belong to this post', 400, 'INVALID_PARENT');
        }
      }

      // Create comment and update counters in transaction
      const comment = await this.prisma.$transaction(async (tx) => {
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

        // If this is a reply, update parent comment reply count
        if (data.parentId) {
          await tx.comment.update({
            where: { id: data.parentId },
            data: { replyCount: { increment: 1 } },
          });
        }

        return comment;
      });

      return this.transformCommentWithUser(comment, userId);
    } catch (error) {
      this.logger.error(`Error creating comment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create comment', 500, 'DATABASE_ERROR');
    }
  }

  async updateComment(
    id: string,
    userId: string,
    data: UpdateCommentDto,
  ): Promise<CommentWithUser> {
    try {
      // Check ownership
      const comment = await this.prisma.comment.findUnique({
        where: { id, deletedAt: null },
        select: { userId: true },
      });

      if (!comment) {
        throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
      }

      if (comment.userId !== userId) {
        throw new AppError('You can only update your own comments', 403, 'FORBIDDEN');
      }

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

      return this.transformCommentWithUser(updatedComment, userId);
    } catch (error) {
      this.logger.error(`Error updating comment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update comment', 500, 'DATABASE_ERROR');
    }
  }

  async deleteComment(id: string, userId: string): Promise<boolean> {
    try {
      // Get comment info including parent relationship
      const comment = await this.prisma.comment.findUnique({
        where: { id, deletedAt: null },
        select: { userId: true, postId: true, parentId: true },
      });

      if (!comment) {
        throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
      }

      // Check ownership or post ownership
      if (comment.userId !== userId) {
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

      // Soft delete and update counters
      await this.prisma.$transaction(async (tx) => {
        await tx.comment.update({
          where: { id },
          data: {
            content: '[Comment deleted]',
            mediaUrl: null,
            deletedAt: new Date(),
          },
        });

        // Update post comment count
        await tx.post.update({
          where: { id: comment.postId },
          data: { commentCount: { decrement: 1 } },
        });

        // If this was a reply, update parent reply count
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

  async getComments(
    options: CommentQueryOptions,
    requestUserId?: string,
  ): Promise<CommentPaginationResult> {
    try {
      const {
        postId,
        userId,
        parentId = null,
        page = 1,
        limit = 10,
        includeLikeStatus = false,
        includeReplies = false,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const where: Prisma.CommentWhereInput = {
        deletedAt: null,
      };

      if (postId) where.postId = postId;
      if (userId) where.userId = userId;
      where.parentId = parentId;

      const total = await this.prisma.comment.count({ where });

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
                  where: { userId: requestUserId },
                }
              : undefined,
          replies: includeReplies
            ? {
                where: { deletedAt: null },
                take: 3,
                orderBy: { createdAt: 'asc' },
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
                          where: { userId: requestUserId },
                        }
                      : undefined,
                },
              }
            : undefined,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: comments.map((comment) =>
          this.transformCommentWithUser(comment, requestUserId, includeReplies),
        ),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting comments: ${error}`);
      throw new AppError('Failed to get comments', 500, 'DATABASE_ERROR');
    }
  }

  async getCommentReplies(
    commentId: string,
    options: Omit<CommentQueryOptions, 'postId' | 'parentId'> = {},
    requestUserId?: string,
  ): Promise<CommentPaginationResult> {
    try {
      // Get parent comment to get postId
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: commentId },
        select: { postId: true },
      });

      if (!parentComment) {
        throw new AppError('Parent comment not found', 404, 'COMMENT_NOT_FOUND');
      }

      const repliesOptions: CommentQueryOptions = {
        ...options,
        postId: parentComment.postId,
        parentId: commentId,
      };

      return this.getComments(repliesOptions, requestUserId);
    } catch (error) {
      this.logger.error(`Error getting comment replies: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get comment replies', 500, 'DATABASE_ERROR');
    }
  }

  async isCommentOwner(id: string, userId: string): Promise<boolean> {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id },
        select: { userId: true },
      });

      return !!comment && comment.userId === userId;
    } catch (error) {
      return false;
    }
  }

  private transformCommentWithUser(
    comment: any,
    requestUserId?: string,
    includeReplies: boolean = false,
  ): CommentWithUser {
    const { likes, replies, ...commentData } = comment;

    const result: CommentWithUser = {
      ...commentData,
      isLiked: requestUserId ? likes?.length > 0 : undefined,
      canEdit: requestUserId ? commentData.userId === requestUserId : false,
      canDelete: requestUserId ? commentData.userId === requestUserId : false,
    };

    if (includeReplies && replies) {
      result.replies = replies.map((reply: any) =>
        this.transformCommentWithUser(reply, requestUserId),
      );
    }

    return result;
  }
}
