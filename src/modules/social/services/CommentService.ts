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
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { IPostRepository } from '../../post/repositories/PostRepository.interface';
import { INotificationService } from '@/modules/notification';
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

  async createComment(userId: string, data: CreateCommentDto): Promise<CommentWithUser> {
    try {
      const comment = await this.commentRepository.createComment(userId, data);

      const post = await this.postRepository.findById(data.postId);
      if (post && post.userId !== userId) {
        const notificationService = container.resolve<INotificationService>('notificationService');
        await notificationService.notifyComment(data.postId, userId, post.userId);
      }

      this.logger.info(
        `User ${userId} ${data.parentId ? 'replied to comment' : 'commented on post'} ${data.parentId || data.postId}`,
      );

      return comment;
    } catch (error) {
      this.logger.error(`Error creating comment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create comment', 500, 'SERVICE_ERROR');
    }
  }

  async updateComment(
    id: string,
    userId: string,
    data: UpdateCommentDto,
  ): Promise<CommentWithUser> {
    try {
      const comment = await this.commentRepository.updateComment(id, userId, data);

      this.logger.info(`User ${userId} updated comment ${id}`);

      return comment;
    } catch (error) {
      this.logger.error(`Error updating comment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update comment', 500, 'SERVICE_ERROR');
    }
  }

  async deleteComment(id: string, userId: string): Promise<boolean> {
    try {
      const result = await this.commentRepository.deleteComment(id, userId);

      if (result) {
        this.logger.info(`User ${userId} deleted comment ${id}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error deleting comment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete comment', 500, 'SERVICE_ERROR');
    }
  }

  async getCommentById(id: string, requestUserId?: string): Promise<CommentWithUser | null> {
    try {
      return await this.commentRepository.findByIdWithUser(id, requestUserId);
    } catch (error) {
      this.logger.error(`Error getting comment by ID: ${error}`);
      return null;
    }
  }

  async getPostComments(
    postId: string,
    options: Omit<CommentQueryOptions, 'postId'> = {},
    requestUserId?: string,
  ): Promise<CommentPaginationResult> {
    try {
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
