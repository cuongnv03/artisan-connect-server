import { ILikeService } from './LikeService.interface';
import {
  Like,
  LikeWithUser,
  ReactionType,
  LikePaginationResult,
} from '../../../domain/social/entities/Like';
import { ILikeRepository } from '../../../domain/social/repositories/LikeRepository.interface';
import { IPostRepository } from '../../../domain/content/repositories/PostRepository.interface';
import { ICommentRepository } from '../../../domain/social/repositories/CommentRepository.interface';
import { INotificationService } from '../notification/NotificationService.interface';
import { NotificationType } from '../../../domain/notification/entities/Notification';
import { AppError } from '../../../shared/errors/AppError';
import { Logger } from '../../../shared/utils/Logger';
import container from '../../../di/container';

export class LikeService implements ILikeService {
  private likeRepository: ILikeRepository;
  private postRepository: IPostRepository;
  private commentRepository: ICommentRepository;
  private notificationService: INotificationService;
  private logger = Logger.getInstance();

  constructor() {
    this.likeRepository = container.resolve<ILikeRepository>('likeRepository');
    this.postRepository = container.resolve<IPostRepository>('postRepository');
    this.commentRepository = container.resolve<ICommentRepository>('commentRepository');
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  /**
   * Toggle like on a post or comment
   */
  async toggleLike(
    userId: string,
    data: { postId?: string; commentId?: string; reaction?: ReactionType },
  ): Promise<boolean> {
    try {
      // Check if already liked
      const hasLiked = await this.hasLiked(userId, {
        postId: data.postId,
        commentId: data.commentId,
      });

      // Toggle like status
      if (hasLiked) {
        await this.removeLike(userId, {
          postId: data.postId,
          commentId: data.commentId,
        });
        return false; // No longer liked
      } else {
        await this.addLike(userId, {
          postId: data.postId,
          commentId: data.commentId,
          reaction: data.reaction,
        });
        return true; // Now liked
      }
    } catch (error) {
      this.logger.error(`Error toggling like: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to toggle like', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Like a post or comment
   */
  async addLike(
    userId: string,
    data: { postId?: string; commentId?: string; reaction?: ReactionType },
  ): Promise<Like> {
    try {
      // Create the like
      const like = await this.likeRepository.createLike(userId, {
        postId: data.postId,
        commentId: data.commentId,
        reaction: data.reaction,
      });

      // Send notification
      await this.sendLikeNotification(userId, {
        postId: data.postId,
        commentId: data.commentId,
        reaction: data.reaction || ReactionType.LIKE,
      });

      return like;
    } catch (error) {
      this.logger.error(`Error adding like: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add like', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Unlike a post or comment
   */
  async removeLike(
    userId: string,
    data: { postId?: string; commentId?: string },
  ): Promise<boolean> {
    try {
      return await this.likeRepository.deleteLike(userId, data);
    } catch (error) {
      this.logger.error(`Error removing like: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to remove like', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Check if user has liked post or comment
   */
  async hasLiked(userId: string, data: { postId?: string; commentId?: string }): Promise<boolean> {
    try {
      return await this.likeRepository.hasLiked(userId, data);
    } catch (error) {
      this.logger.error(`Error checking if liked: ${error}`);
      return false;
    }
  }

  /**
   * Get likes for a post
   */
  async getPostLikes(postId: string, page?: number, limit?: number): Promise<LikePaginationResult> {
    try {
      return await this.likeRepository.getPostLikes(postId, page, limit);
    } catch (error) {
      this.logger.error(`Error getting post likes: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get post likes', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get likes for a comment
   */
  async getCommentLikes(
    commentId: string,
    page?: number,
    limit?: number,
  ): Promise<LikePaginationResult> {
    try {
      return await this.likeRepository.getCommentLikes(commentId, page, limit);
    } catch (error) {
      this.logger.error(`Error getting comment likes: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get comment likes', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get like count for post or comment
   */
  async getLikeCount(data: { postId?: string; commentId?: string }): Promise<number> {
    try {
      return await this.likeRepository.getLikesCount(data);
    } catch (error) {
      this.logger.error(`Error getting like count: ${error}`);
      if (error instanceof AppError) throw error;
      return 0;
    }
  }

  /**
   * Send notification about the like
   */
  private async sendLikeNotification(
    likerId: string,
    data: { postId?: string; commentId?: string; reaction: ReactionType },
  ): Promise<void> {
    try {
      if (data.postId) {
        // Get post and its owner
        const post = await this.postRepository.findByIdWithUser(data.postId);
        if (!post || post.userId === likerId) return; // Don't notify if post not found or self-like

        // Get liker name
        const liker = await container.resolve('userRepository').findById(likerId);
        if (!liker) return;

        // Create notification
        await this.notificationService.createNotification({
          userId: post.userId,
          type: NotificationType.LIKE,
          title: 'New Like on Your Post',
          content: `${liker.firstName} ${liker.lastName} liked your post: "${post.title.substring(0, 30)}${post.title.length > 30 ? '...' : ''}"`,
          relatedUserId: likerId,
          relatedEntityId: post.id,
          relatedEntityType: 'post',
        });
      } else if (data.commentId) {
        // Get comment and its owner
        const comment = await this.commentRepository.findByIdWithUser(data.commentId);
        if (!comment || comment.userId === likerId) return; // Don't notify if comment not found or self-like

        // Get liker name
        const liker = await container.resolve('userRepository').findById(likerId);
        if (!liker) return;

        // Create notification
        await this.notificationService.createNotification({
          userId: comment.userId,
          type: NotificationType.LIKE,
          title: 'New Like on Your Comment',
          content: `${liker.firstName} ${liker.lastName} liked your comment`,
          relatedUserId: likerId,
          relatedEntityId: comment.id,
          relatedEntityType: 'comment',
        });
      }
    } catch (error) {
      this.logger.error(`Error sending like notification: ${error}`);
      // Don't throw for notification failures
    }
  }
}
