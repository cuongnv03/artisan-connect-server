import { withErrorHandling, applyErrorHandlingToClass } from '../../../shared/utils/ErrorHandling';
import { IPostService } from './PostService.interface';
import { EventBus } from '../../../core/events/EventBus';
import {
  Post,
  PostWithUser,
  CreatePostDto,
  UpdatePostDto,
  PostStatus,
  PostQueryOptions,
  PostPaginationResult,
} from '../models/Post';
import { IPostRepository } from '../repositories/PostRepository.interface';
import { IProductRepository } from '../../product/repositories/ProductRepository.interface';
import { IUserRepository } from '../../user/repositories/UserRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export class PostService implements IPostService {
  private postRepository: IPostRepository;
  private productRepository: IProductRepository;
  private userRepository: IUserRepository;
  private logger = Logger.getInstance();
  private eventBus = EventBus.getInstance();

  constructor() {
    this.postRepository = container.resolve<IPostRepository>('postRepository');
    this.productRepository = container.resolve<IProductRepository>('productRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
    this.initErrorHandling();
  }

  private initErrorHandling(): void {
    applyErrorHandlingToClass(this, [
      { methodName: 'createPost', errorMessage: 'Failed to create post' },
      { methodName: 'updatePost', errorMessage: 'Failed to update post' },
      { methodName: 'deletePost', errorMessage: 'Failed to delete post' },
      { methodName: 'publishPost', errorMessage: 'Failed to publish post' },
      { methodName: 'archivePost', errorMessage: 'Failed to archive post' },
      { methodName: 'getPosts', errorMessage: 'Failed to get posts' },
      { methodName: 'getFollowedPosts', errorMessage: 'Failed to get followed posts' },
      { methodName: 'getMyPosts', errorMessage: 'Failed to get my posts' },
      { methodName: 'viewPost', errorMessage: 'Failed to view post' },
      { methodName: 'getPostStatusCounts', errorMessage: 'Failed to get post status counts' },
    ]);
  }

  /**
   * Create a new post
   */
  private async _createPost(userId: string, data: CreatePostDto): Promise<PostWithUser> {
    // Validate user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Validate products if provided
    if (data.productIds && data.productIds.length > 0) {
      for (const productId of data.productIds) {
        const product = await this.productRepository.findById(productId);
        if (!product) {
          throw new AppError(`Product with ID ${productId} not found`, 404, 'PRODUCT_NOT_FOUND');
        }
      }
    }

    // Create post
    const post = await this.postRepository.createPost(userId, data);

    // If post is published immediately, emit event
    if (data.publishNow && data.status === PostStatus.PUBLISHED) {
      const user = await this.userRepository.findById(userId);
      if (user) {
        const authorName = user.artisanProfile
          ? user.artisanProfile.shopName
          : `${user.firstName} ${user.lastName}`;

        this.eventBus.publish('post.published', {
          authorId: userId,
          authorName,
          postId: post.id,
          postTitle: post.title,
        });
      }
    }

    return post;
  }

  // Tạo proxy cho createPost thông qua HOF
  createPost = withErrorHandling(
    this._createPost.bind(this),
    'Failed to create post',
    'POST_CREATION_ERROR',
    this.logger,
  );

  /**
   * Update a post
   */
  async updatePost(id: string, userId: string, data: UpdatePostDto): Promise<PostWithUser> {
    try {
      // Check if post exists and belongs to user
      const post = await this.postRepository.findByIdWithUser(id);
      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      if (post.userId !== userId) {
        throw new AppError('You can only update your own posts', 403, 'FORBIDDEN');
      }

      // Validate products if provided
      if (data.productIds && data.productIds.length > 0) {
        for (const productId of data.productIds) {
          const product = await this.productRepository.findById(productId);
          if (!product) {
            throw new AppError(`Product with ID ${productId} not found`, 404, 'PRODUCT_NOT_FOUND');
          }
        }
      }

      // Update post
      const updatedPost = await this.postRepository.updatePost(id, userId, data);

      // If post was draft and is now published, emit event
      if (post && post.status === PostStatus.DRAFT && data.status === PostStatus.PUBLISHED) {
        const user = await this.userRepository.findById(userId);
        if (user) {
          const authorName = user.artisanProfile
            ? user.artisanProfile.shopName
            : `${user.firstName} ${user.lastName}`;

          this.eventBus.publish('post.published', {
            authorId: userId,
            authorName,
            postId: id,
            postTitle: updatedPost.title,
          });
        }
      }

      return updatedPost;
    } catch (error) {
      this.logger.error(`Error updating post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update post', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get post by ID
   */
  async getPostById(id: string, requestUserId?: string): Promise<PostWithUser | null> {
    try {
      return await this.postRepository.findByIdWithUser(id, requestUserId);
    } catch (error) {
      this.logger.error(`Error getting post by ID: ${error}`);
      return null;
    }
  }

  /**
   * Get post by slug
   */
  async getPostBySlug(slug: string, requestUserId?: string): Promise<PostWithUser | null> {
    try {
      return await this.postRepository.findBySlugWithUser(slug, requestUserId);
    } catch (error) {
      this.logger.error(`Error getting post by slug: ${error}`);
      return null;
    }
  }

  /**
   * Delete a post
   */
  async deletePost(id: string, userId: string): Promise<boolean> {
    try {
      return await this.postRepository.deletePost(id, userId);
    } catch (error) {
      this.logger.error(`Error deleting post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete post', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Publish a draft post
   */
  async publishPost(id: string, userId: string): Promise<PostWithUser> {
    try {
      const post = await this.postRepository.publishPost(id, userId);

      // Get user info for notification
      const user = await this.userRepository.findById(userId);
      if (user) {
        const authorName = user.artisanProfile
          ? user.artisanProfile.shopName
          : `${user.firstName} ${user.lastName}`;

        // Emit event instead of direct call
        this.eventBus.publish('post.published', {
          authorId: userId,
          authorName,
          postId: id,
          postTitle: post.title,
        });
      }

      return post;
    } catch (error) {
      this.logger.error(`Error publishing post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to publish post', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Archive a published post
   */
  async archivePost(id: string, userId: string): Promise<PostWithUser> {
    try {
      return await this.postRepository.archivePost(id, userId);
    } catch (error) {
      this.logger.error(`Error archiving post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to archive post', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get posts with filtering and pagination
   */
  async getPosts(options: PostQueryOptions, requestUserId?: string): Promise<PostPaginationResult> {
    try {
      if (options.followedOnly && requestUserId) {
        return this.getFollowedPosts(requestUserId, options);
      }

      return await this.postRepository.getPosts(options, requestUserId);
    } catch (error) {
      this.logger.error(`Error getting posts: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get posts', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get posts from users that the current user follows
   */
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

  /**
   * Get my posts as a creator (with drafts, etc.)
   */
  async getMyPosts(
    userId: string,
    options: Omit<PostQueryOptions, 'userId'> = {},
  ): Promise<PostPaginationResult> {
    try {
      const myOptions: PostQueryOptions = {
        ...options,
        userId,
        includeLikeStatus: false,
        includeSaveStatus: false,
      };

      // Default to include all statuses except deleted
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

  /**
   * View a post (increment view count)
   */
  async viewPost(id: string, userId?: string): Promise<void> {
    try {
      await this.postRepository.incrementViewCount(id);
    } catch (error) {
      this.logger.error(`Error viewing post: ${error}`);
      // Don't throw errors for view increments
    }
  }

  /**
   * Get post status counts for a user
   */
  async getPostStatusCounts(userId: string): Promise<Record<string, number>> {
    try {
      return await this.postRepository.getPostStatusCounts(userId);
    } catch (error) {
      this.logger.error(`Error getting post status counts: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get post status counts', 500, 'SERVICE_ERROR');
    }
  }
}
