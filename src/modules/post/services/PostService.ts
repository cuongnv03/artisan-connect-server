import { IPostService } from './PostService.interface';
import {
  Post,
  PostWithUser,
  CreatePostDto,
  UpdatePostDto,
  PostQueryOptions,
  PostPaginationResult,
  PostStatus,
} from '../models/Post';
import { IPostRepository } from '../repositories/PostRepository.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export class PostService implements IPostService {
  private postRepository: IPostRepository;
  private userRepository: IUserRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.postRepository = container.resolve<IPostRepository>('postRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
  }

  async createPost(userId: string, data: CreatePostDto): Promise<PostWithUser> {
    try {
      // Get user with artisan profile for logging
      const userWithProfile = await this.getUserWithArtisanProfile(userId);
      if (!userWithProfile) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Create post
      const post = await this.postRepository.createPost(userId, data);

      // Enhanced logging with author information
      const authorName = userWithProfile.artisanProfile
        ? userWithProfile.artisanProfile.shopName
        : `${userWithProfile.firstName} ${userWithProfile.lastName}`;

      if (data.publishNow) {
        this.logger.info(`Post published: ${post.id} "${post.title}" by ${authorName} (${userId})`);
      } else {
        this.logger.info(
          `Post created as draft: ${post.id} "${post.title}" by ${authorName} (${userId})`,
        );
      }

      return post;
    } catch (error) {
      this.logger.error(`Error creating post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create post', 500, 'SERVICE_ERROR');
    }
  }

  async updatePost(id: string, userId: string, data: UpdatePostDto): Promise<PostWithUser> {
    try {
      const post = await this.postRepository.updatePost(id, userId, data);

      this.logger.info(`Post updated: ${id} by user ${userId}`);

      return post;
    } catch (error) {
      this.logger.error(`Error updating post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update post', 500, 'SERVICE_ERROR');
    }
  }

  async getPostById(id: string, requestUserId?: string): Promise<PostWithUser | null> {
    try {
      return await this.postRepository.findByIdWithUser(id, requestUserId);
    } catch (error) {
      this.logger.error(`Error getting post by ID: ${error}`);
      return null;
    }
  }

  async getPostBySlug(slug: string, requestUserId?: string): Promise<PostWithUser | null> {
    try {
      return await this.postRepository.findBySlugWithUser(slug, requestUserId);
    } catch (error) {
      this.logger.error(`Error getting post by slug: ${error}`);
      return null;
    }
  }

  async deletePost(id: string, userId: string): Promise<boolean> {
    try {
      const result = await this.postRepository.deletePost(id, userId);

      if (result) {
        this.logger.info(`Post deleted: ${id} by user ${userId}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error deleting post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete post', 500, 'SERVICE_ERROR');
    }
  }

  async publishPost(id: string, userId: string): Promise<PostWithUser> {
    try {
      const post = await this.postRepository.publishPost(id, userId);

      this.logger.info(`Post published: ${id} "${post.title}" by user ${userId}`);

      return post;
    } catch (error) {
      this.logger.error(`Error publishing post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to publish post', 500, 'SERVICE_ERROR');
    }
  }

  async archivePost(id: string, userId: string): Promise<PostWithUser> {
    try {
      const post = await this.postRepository.archivePost(id, userId);

      this.logger.info(`Post archived: ${id} "${post.title}" by user ${userId}`);

      return post;
    } catch (error) {
      this.logger.error(`Error archiving post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to archive post', 500, 'SERVICE_ERROR');
    }
  }

  async getPosts(options: PostQueryOptions, requestUserId?: string): Promise<PostPaginationResult> {
    try {
      return await this.postRepository.getPosts(options, requestUserId);
    } catch (error) {
      this.logger.error(`Error getting posts: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get posts', 500, 'SERVICE_ERROR');
    }
  }

  async getFollowedPosts(
    userId: string,
    options: Omit<PostQueryOptions, 'followedOnly'> = {},
  ): Promise<PostPaginationResult> {
    try {
      return await this.postRepository.getFollowedPosts(userId, options);
    } catch (error) {
      this.logger.error(`Error getting followed posts: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get followed posts', 500, 'SERVICE_ERROR');
    }
  }

  async getMyPosts(
    userId: string,
    options: Omit<PostQueryOptions, 'userId'> = {},
  ): Promise<PostPaginationResult> {
    try {
      const myOptions: PostQueryOptions = {
        ...options,
        userId,
      };

      // Default to include all statuses except deleted for own posts
      if (!myOptions.status) {
        myOptions.status = [PostStatus.DRAFT, PostStatus.PUBLISHED, PostStatus.ARCHIVED];
      }

      return await this.postRepository.getPosts(myOptions);
    } catch (error) {
      this.logger.error(`Error getting my posts: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get my posts', 500, 'SERVICE_ERROR');
    }
  }

  async viewPost(id: string, userId?: string): Promise<void> {
    try {
      await this.postRepository.incrementViewCount(id);

      if (userId) {
        this.logger.debug(`Post ${id} viewed by user ${userId}`);
      } else {
        this.logger.debug(`Post ${id} viewed by anonymous user`);
      }
    } catch (error) {
      this.logger.error(`Error viewing post: ${error}`);
      // Don't throw errors for view increments as they are non-critical
    }
  }

  async getPostStatusCounts(userId: string): Promise<Record<string, number>> {
    try {
      return await this.postRepository.getPostStatusCounts(userId);
    } catch (error) {
      this.logger.error(`Error getting post status counts: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get post status counts', 500, 'SERVICE_ERROR');
    }
  }

  // Helper method to get user with artisan profile for enhanced logging
  private async getUserWithArtisanProfile(userId: string): Promise<any> {
    try {
      // Use Prisma directly for this specific query since UserRepository might not support includes
      const { PrismaClientManager } = await import('../../../core/database/PrismaClient');
      const prisma = PrismaClientManager.getClient();

      return await prisma.user.findUnique({
        where: { id: userId },
        include: {
          artisanProfile: {
            select: {
              shopName: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error getting user with artisan profile: ${error}`);
      // Fallback to regular user repository
      return await this.userRepository.findById(userId);
    }
  }
}
