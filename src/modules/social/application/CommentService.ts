import { ICommentService } from './CommentService.interface';
import { EventBus } from '../../../core/events/EventBus';
import {
  Comment,
  CommentWithUser,
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryOptions,
  CommentPaginationResult,
} from '../domain/entities/Comment';
import { ICommentRepository } from '../domain/repositories/CommentRepository.interface';
import { IUserRepository } from '../../user/domain/repositories/UserRepository.interface';
import { IPostRepository } from '../../content/domain/repositories/PostRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export class CommentService implements ICommentService {
  private commentRepository: ICommentRepository;
  private postRepository: IPostRepository;
  private logger = Logger.getInstance();
  private eventBus = EventBus.getInstance();

  constructor() {
    this.commentRepository = container.resolve<ICommentRepository>('commentRepository');
    this.postRepository = container.resolve<IPostRepository>('postRepository');
  }

  /**
   * Create a comment
   */
  async createComment(userId: string, data: CreateCommentDto): Promise<CommentWithUser> {
    try {
      const comment = await this.commentRepository.createComment(userId, data);

      // Get commenter info
      const commenter = await container.resolve<IUserRepository>('userRepository').findById(userId);
      if (!commenter) return comment;

      const commenterName = `${commenter.firstName} ${commenter.lastName}`;

      // Get post info
      const post = await this.postRepository.findByIdWithUser(data.postId);
      if (!post) return comment;

      // Emit event if this is a new comment on a post
      if (!data.parentId) {
        this.eventBus.publish('post.commented', {
          postOwnerId: post.userId,
          commenterId: userId,
          commenterName,
          postId: data.postId,
          postTitle: post.title,
          commentId: comment.id,
        });
      }
      // Emit event if this is a reply to another comment
      else {
        const parentComment = await this.commentRepository.findByIdWithUser(data.parentId);
        if (parentComment && parentComment.userId !== userId) {
          this.eventBus.publish('comment.replied', {
            parentCommentOwnerId: parentComment.userId,
            replierId: userId,
            replierName: commenterName,
            parentCommentId: data.parentId,
            replyId: comment.id,
            postId: data.postId,
            postTitle: post.title,
          });
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
      return await this.commentRepository.updateComment(id, userId, data);
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
      return await this.commentRepository.deleteComment(id, userId);
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
