import { ICommentService } from './CommentService.interface';
import {
  Comment,
  CommentWithUser,
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryOptions,
  CommentPaginationResult,
} from '../../../domain/social/entities/Comment';
import { ICommentRepository } from '../../../domain/social/repositories/CommentRepository.interface';
import { IPostRepository } from '../../../domain/content/repositories/PostRepository.interface';
import { INotificationService } from '../notification/NotificationService.interface';
import { NotificationType } from '../../../domain/notification/entities/Notification';
import { AppError } from '../../../shared/errors/AppError';
import { Logger } from '../../../shared/utils/Logger';
import container from '../../../di/container';

export class CommentService implements ICommentService {
  private commentRepository: ICommentRepository;
  private postRepository: IPostRepository;
  private notificationService: INotificationService;
  private logger = Logger.getInstance();

  constructor() {
    this.commentRepository = container.resolve<ICommentRepository>('commentRepository');
    this.postRepository = container.resolve<IPostRepository>('postRepository');
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  /**
   * Create a comment
   */
  async createComment(userId: string, data: CreateCommentDto): Promise<CommentWithUser> {
    try {
      const comment = await this.commentRepository.createComment(userId, data);

      // Send notification
      await this.sendCommentNotification(userId, comment);

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

  /**
   * Send notification about the comment
   */
  private async sendCommentNotification(
    commenterId: string,
    comment: CommentWithUser,
  ): Promise<void> {
    try {
      // Don't notify for self-comments
      const post = await this.postRepository.findByIdWithUser(comment.postId);
      if (!post) return;

      // Get commenter info
      const commenter = await container.resolve('userRepository').findById(commenterId);
      if (!commenter) return;

      const commenterName = `${commenter.firstName} ${commenter.lastName}`;

      // If this is a reply, notify the parent comment owner
      if (comment.parentId) {
        const parentComment = await this.commentRepository.findByIdWithUser(comment.parentId);
        if (parentComment && parentComment.userId !== commenterId) {
          await this.notificationService.createNotification({
            userId: parentComment.userId,
            type: NotificationType.COMMENT,
            title: 'New Reply to Your Comment',
            content: `${commenterName} replied to your comment`,
            relatedUserId: commenterId,
            relatedEntityId: comment.id,
            relatedEntityType: 'comment',
          });
        }
      }

      // Notify post owner if commenter is not the owner
      if (post.userId !== commenterId) {
        await this.notificationService.createNotification({
          userId: post.userId,
          type: NotificationType.COMMENT,
          title: 'New Comment on Your Post',
          content: `${commenterName} commented on your post: "${post.title.substring(0, 30)}${post.title.length > 30 ? '...' : ''}"`,
          relatedUserId: commenterId,
          relatedEntityId: post.id,
          relatedEntityType: 'post',
        });
      }
    } catch (error) {
      this.logger.error(`Error sending comment notification: ${error}`);
      // Don't throw for notification failures
    }
  }
}
