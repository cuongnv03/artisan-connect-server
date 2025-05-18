import { ILikeService } from './LikeService.interface';
import { Like, LikeWithUser, ReactionType, LikePaginationResult } from '../models/Like';
import { ILikeRepository } from '../repositories/LikeRepository.interface';
import { IUserRepository } from '../../user/repositories/UserRepository.interface';
import { IPostRepository } from '../../post/repositories/PostRepository.interface';
import { ICommentRepository } from '../repositories/CommentRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export class LikeService implements ILikeService {
  private likeRepository: ILikeRepository;
  private postRepository: IPostRepository;
  private commentRepository: ICommentRepository;
  private userRepository: IUserRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.likeRepository = container.resolve<ILikeRepository>('likeRepository');
    this.postRepository = container.resolve<IPostRepository>('postRepository');
    this.commentRepository = container.resolve<ICommentRepository>('commentRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
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

      // Get liker info for logging
      const liker = await this.userRepository.findById(userId);
      if (liker) {
        const likerName = `${liker.firstName} ${liker.lastName}`;

        // Log appropriate information based on what was liked
        if (data.postId) {
          const post = await this.postRepository.findByIdWithUser(data.postId);
          if (post) {
            this.logger.info(
              `User ${userId} (${likerName}) liked post ${data.postId} "${post.title}" with reaction: ${data.reaction || ReactionType.LIKE}`,
            );
          }
        } else if (data.commentId) {
          const comment = await this.commentRepository.findByIdWithUser(data.commentId);
          if (comment) {
            this.logger.info(
              `User ${userId} (${likerName}) liked comment ${data.commentId} on post ${comment.postId} with reaction: ${data.reaction || ReactionType.LIKE}`,
            );
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
      const result = await this.likeRepository.deleteLike(userId, data);

      // Log the unlike action
      if (result) {
        if (data.postId) {
          this.logger.info(`User ${userId} unliked post ${data.postId}`);
        } else if (data.commentId) {
          this.logger.info(`User ${userId} unliked comment ${data.commentId}`);
        }
      }

      return result;
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
