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
      const existingSave = await this.prisma.savedPost.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
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

  async unsavePost(userId: string, postId: string): Promise<boolean> {
    try {
      const result = await this.prisma.savedPost.deleteMany({
        where: {
          userId,
          postId,
        },
      });

      return result.count > 0;
    } catch (error) {
      this.logger.error(`Error unsaving post: ${error}`);
      return false;
    }
  }

  async hasSaved(userId: string, postId: string): Promise<boolean> {
    try {
      const savedPost = await this.prisma.savedPost.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      return !!savedPost;
    } catch (error) {
      this.logger.error(`Error checking if post is saved: ${error}`);
      return false;
    }
  }

  async getSavedPosts(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<SavedPostPaginationResult> {
    try {
      const total = await this.prisma.savedPost.count({
        where: {
          userId,
          post: {
            status: 'PUBLISHED',
            deletedAt: null,
          },
        },
      });

      const savedPosts = await this.prisma.savedPost.findMany({
        where: {
          userId,
          post: {
            status: 'PUBLISHED',
            deletedAt: null,
          },
        },
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: savedPosts as unknown as SavedPostWithDetails[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting saved posts: ${error}`);
      throw new AppError('Failed to get saved posts', 500, 'DATABASE_ERROR');
    }
  }
}
