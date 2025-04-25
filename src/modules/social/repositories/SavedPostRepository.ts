import { PrismaClient, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { ISavedPostRepository } from './SavedPostRepository.interface';
import { SavedPost, SavedPostWithDetails, SavedPostPaginationResult } from '../models/SavedPost';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class SavedPostRepository
  extends BasePrismaRepository<SavedPost, string>
  implements ISavedPostRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'savedPost');
  }

  /**
   * Save a post
   */
  async savePost(userId: string, postId: string): Promise<SavedPost> {
    try {
      // Check if post exists and is published
      const post = await this.prisma.post.findFirst({
        where: {
          id: postId,
          status: 'PUBLISHED',
          deletedAt: null,
        },
      });

      if (!post) {
        throw new AppError('Post not found or not available', 404, 'POST_NOT_FOUND');
      }

      // Check if already saved
      const existingSave = await this.prisma.savedPost.findFirst({
        where: {
          userId,
          postId,
        },
      });

      if (existingSave) {
        return existingSave as SavedPost;
      }

      // Save the post
      const savedPost = await this.prisma.savedPost.create({
        data: {
          userId,
          postId,
        },
      });

      return savedPost as SavedPost;
    } catch (error) {
      this.logger.error(`Error saving post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to save post', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Unsave a post
   */
  async unsavePost(userId: string, postId: string): Promise<boolean> {
    try {
      // Find the saved post
      const savedPost = await this.prisma.savedPost.findFirst({
        where: {
          userId,
          postId,
        },
      });

      if (!savedPost) {
        return false; // Not found, nothing to delete
      }

      // Delete the saved post
      await this.prisma.savedPost.delete({
        where: {
          id: savedPost.id,
        },
      });

      return true;
    } catch (error) {
      this.logger.error(`Error unsaving post: ${error}`);
      throw new AppError('Failed to unsave post', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Check if user has saved a post
   */
  async hasSaved(userId: string, postId: string): Promise<boolean> {
    try {
      const savedPost = await this.prisma.savedPost.findFirst({
        where: {
          userId,
          postId,
        },
      });

      return !!savedPost;
    } catch (error) {
      this.logger.error(`Error checking if post is saved: ${error}`);
      return false;
    }
  }

  /**
   * Get saved posts for a user
   */
  async getSavedPosts(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<SavedPostPaginationResult> {
    try {
      // Count total saved posts
      const total = await this.prisma.savedPost.count({
        where: {
          userId,
          post: {
            status: 'PUBLISHED',
            deletedAt: null,
          },
        },
      });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Get saved posts with pagination
      const savedPosts = await this.prisma.savedPost.findMany({
        where: {
          userId,
          post: {
            status: 'PUBLISHED',
            deletedAt: null,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          post: {
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
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },
          },
        },
      });

      // Process saved posts to add like and comment counts
      const processedSavedPosts = savedPosts.map((savedPost) => {
        const { post, ...restSavedPost } = savedPost;
        const { _count, ...restPost } = post;

        return {
          ...restSavedPost,
          post: {
            ...restPost,
            likeCount: _count.likes,
            commentCount: _count.comments,
          },
        };
      });

      return {
        data: processedSavedPosts as SavedPostWithDetails[],
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error in getSavedPosts repository method: ${error}`);

      // Bảo toàn database error context
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Thêm thông tin cho một số lỗi cụ thể
        if (error.code === 'P2025') {
          throw AppError.notFound('Requested resources not found', 'NOT_FOUND', {
            cause: error,
            metadata: {
              prismaCode: error.code,
              prismaModel: error.meta?.modelName,
            },
          });
        }

        // Lỗi Prisma khác
        throw AppError.internal('Database operation failed', 'DATABASE_ERROR', {
          cause: error,
          metadata: {
            prismaCode: error.code,
            prismaTarget: error.meta?.target,
          },
        });
      }

      // Lỗi khác
      throw AppError.internal('Repository operation failed', 'REPOSITORY_ERROR', {
        cause: error as Error,
        metadata: { operation: 'getSavedPosts', userId, page, limit },
      });
    }
  }
}
