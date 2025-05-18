import { ICommentService } from './CommentService.interface';
import {
  Comment,
  CommentWithUser,
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryOptions,
  CommentPaginationResult,
} from '../models/Comment';
import { ICommentRepository } from '../repositories/CommentRepository.interface';
import { IUserRepository } from '../../user/repositories/UserRepository.interface';
import { IPostRepository } from '../../post/repositories/PostRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export class CommentService implements ICommentService {
  private commentRepository: ICommentRepository;
  private postRepository: IPostRepository;
  private userRepository: IUserRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.commentRepository = container.resolve<ICommentRepository>('commentRepository');
    this.postRepository = container.resolve<IPostRepository>('postRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
  }

  /**
   * Create a comment
   */
  async createComment(userId: string, data: CreateCommentDto): Promise<CommentWithUser> {
    try {
      const comment = await this.commentRepository.createComment(userId, data);

      // Get commenter info for logging
      const commenter = await this.userRepository.findById(userId);
      if (!commenter) return comment;

      const commenterName = `${commenter.firstName} ${commenter.lastName}`;

      // Get post info for logging
      const post = await this.postRepository.findByIdWithUser(data.postId);
      if (!post) return comment;

      // Log based on comment type (new comment or reply)
      if (!data.parentId) {
        this.logger.info(
          `User ${userId} (${commenterName}) commented on post ${data.postId} "${post.title}"`,
        );
      } else {
        const parentComment = await this.commentRepository.findByIdWithUser(data.parentId);
        if (parentComment) {
          this.logger.info(
            `User ${userId} (${commenterName}) replied to comment ${data.parentId} on post ${data.postId} "${post.title}"`,
          );
        }
      }

      return comment;
    } catch (error) {
      this.logger.error(`Error creating comment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create comment', 500, 'SERVICE_ERROR');
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
      const updated = await this.commentRepository.updateComment(id, userId, data);

      this.logger.info(`User ${userId} updated comment ${id}`);

      return updated;
    } catch (error) {
      this.logger.error(`Error updating comment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update comment', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(id: string, userId: string): Promise<boolean> {
    try {
      // Get comment info before deletion for logging
      const comment = await this.commentRepository.findByIdWithUser(id);

      const deleted = await this.commentRepository.deleteComment(id, userId);

      if (deleted && comment) {
        this.logger.info(`User ${userId} deleted comment ${id} on post ${comment.postId}`);
      }

      return deleted;
    } catch (error) {
      this.logger.error(`Error deleting comment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete comment', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get comment by ID
   */
  async getCommentById(id: string, requestUserId?: string): Promise<CommentWithUser | null> {
    try {
      return await this.commentRepository.findByIdWithUser(id, requestUserId);
    } catch (error) {
      this.logger.error(`Error getting comment by ID: ${error}`);
      return null;
    }
  }

  /**
   * Get post comments
   */
  async getPostComments(
    postId: string,
    options: Omit<CommentQueryOptions, 'postId'> = {},
    requestUserId?: string,
  ): Promise<CommentPaginationResult> {
    try {
      // Verify post exists
      const post = await this.postRepository.findById(postId);
      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      // Default to getting top-level comments only
      const commentOptions: CommentQueryOptions = {
        ...options,
        postId,
        parentId: options.parentId !== undefined ? options.parentId : null, // Default to top-level
      };

      return await this.commentRepository.getComments(commentOptions, requestUserId);
    } catch (error) {
      this.logger.error(`Error getting post comments: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get post comments', 500, 'SERVICE_ERROR');
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
      return await this.commentRepository.getCommentReplies(commentId, options, requestUserId);
    } catch (error) {
      this.logger.error(`Error getting comment replies: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get comment replies', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get user's comments
   */
  async getUserComments(
    userId: string,
    options: Omit<CommentQueryOptions, 'userId'> = {},
    requestUserId?: string,
  ): Promise<CommentPaginationResult> {
    try {
      const commentOptions: CommentQueryOptions = {
        ...options,
        userId,
      };

      return await this.commentRepository.getComments(commentOptions, requestUserId);
    } catch (error) {
      this.logger.error(`Error getting user comments: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get user comments', 500, 'SERVICE_ERROR');
    }
  }
}
