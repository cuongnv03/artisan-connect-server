import { ILikeService } from './LikeService.interface';
import { Like, LikeWithUser, LikePaginationResult } from '../models/Like';
import { ILikeRepository } from '../repositories/LikeRepository.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { IPostRepository } from '../../post/repositories/PostRepository.interface';
import { ICommentRepository } from '../repositories/CommentRepository.interface';
import { INotificationService } from '@/modules/notification';
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

  async toggleLike(
    userId: string,
    data: { postId?: string; commentId?: string },
  ): Promise<boolean> {
    try {
      const hasLiked = await this.hasLiked(userId, data);

      if (hasLiked) {
        await this.removeLike(userId, data);
        return false; // No longer liked
      } else {
        await this.addLike(userId, data);
        return true; // Now liked
      }
    } catch (error) {
      this.logger.error(`Error toggling like: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to toggle like', 500, 'SERVICE_ERROR');
    }
  }

  async addLike(userId: string, data: { postId?: string; commentId?: string }): Promise<Like> {
    try {
      const like = await this.likeRepository.createLike(userId, data);

      if (data.postId) {
        const post = await this.postRepository.findById(data.postId);
        if (post && post.userId !== userId) {
          const notificationService =
            container.resolve<INotificationService>('notificationService');
          await notificationService.notifyLike(data.postId, userId, post.userId);
        }
      }

      this.logger.info(
        `User ${userId} liked ${data.postId ? 'post' : 'comment'} ${data.postId || data.commentId}`,
      );

      return like;
    } catch (error) {
      this.logger.error(`Error adding like: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add like', 500, 'SERVICE_ERROR');
    }
  }

  async removeLike(
    userId: string,
    data: { postId?: string; commentId?: string },
  ): Promise<boolean> {
    try {
      const result = await this.likeRepository.deleteLike(userId, data);

      if (result) {
        this.logger.info(
          `User ${userId} unliked ${data.postId ? 'post' : 'comment'} ${data.postId || data.commentId}`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Error removing like: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to remove like', 500, 'SERVICE_ERROR');
    }
  }

  async hasLiked(userId: string, data: { postId?: string; commentId?: string }): Promise<boolean> {
    try {
      return await this.likeRepository.hasLiked(userId, data);
    } catch (error) {
      this.logger.error(`Error checking if liked: ${error}`);
      return false;
    }
  }

  async getPostLikes(postId: string, page?: number, limit?: number): Promise<LikePaginationResult> {
    try {
      return await this.likeRepository.getPostLikes(postId, page, limit);
    } catch (error) {
      this.logger.error(`Error getting post likes: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get post likes', 500, 'SERVICE_ERROR');
    }
  }

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

  async getLikeCount(data: { postId?: string; commentId?: string }): Promise<number> {
    try {
      return await this.likeRepository.getLikesCount(data);
    } catch (error) {
      this.logger.error(`Error getting like count: ${error}`);
      return 0;
    }
  }
}
