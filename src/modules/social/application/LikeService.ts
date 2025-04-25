import { ILikeService } from './LikeService.interface';
import { EventBus } from '../../../core/events/EventBus';
import { Like, LikeWithUser, ReactionType, LikePaginationResult } from '../domain/entities/Like';
import { ILikeRepository } from '../domain/repositories/LikeRepository.interface';
import { IUserRepository } from '../../user/domain/repositories/UserRepository.interface';
import { IPostRepository } from '../../content/domain/repositories/PostRepository.interface';
import { ICommentRepository } from '../domain/repositories/CommentRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export class LikeService implements ILikeService {
  private likeRepository: ILikeRepository;
  private postRepository: IPostRepository;
  private commentRepository: ICommentRepository;
  private logger = Logger.getInstance();
  private eventBus = EventBus.getInstance();

  constructor() {
    this.likeRepository = container.resolve<ILikeRepository>('likeRepository');
    this.postRepository = container.resolve<IPostRepository>('postRepository');
    this.commentRepository = container.resolve<ICommentRepository>('commentRepository');
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

      // Get liker info
      const liker = await container.resolve<IUserRepository>('userRepository').findById(userId);
      if (liker) {
        const likerName = `${liker.firstName} ${liker.lastName}`;

        // Emit appropriate event
        if (data.postId) {
          const post = await this.postRepository.findByIdWithUser(data.postId);
          if (post && post.userId !== userId) {
            this.eventBus.publish('post.liked', {
              postOwnerId: post.userId,
              likerId: userId,
              likerName,
              postId: data.postId,
              postTitle: post.title,
              reaction: data.reaction || ReactionType.LIKE,
            });
          }
        } else if (data.commentId) {
          const comment = await this.commentRepository.findByIdWithUser(data.commentId);
          if (comment && comment.userId !== userId) {
            this.eventBus.publish('comment.liked', {
              commentOwnerId: comment.userId,
              likerId: userId,
              likerName,
              commentId: data.commentId,
              postId: comment.postId,
              reaction: data.reaction || ReactionType.LIKE,
            });
          }
        }
      }

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
}
