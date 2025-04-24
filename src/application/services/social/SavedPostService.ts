import { ISavedPostService } from './SavedPostService.interface';
import {
  SavedPost,
  SavedPostWithDetails,
  SavedPostPaginationResult,
} from '../../../domain/social/entities/SavedPost';
import { ISavedPostRepository } from '../../../domain/social/repositories/SavedPostRepository.interface';
import { IUserRepository } from '../../../domain/user/repositories/UserRepository.interface';
import { IPostRepository } from '../../../domain/content/repositories/PostRepository.interface';
import { AppError } from '../../../shared/errors/AppError';
import { Logger } from '../../../shared/utils/Logger';
import container from '../../../di/container';

export class SavedPostService implements ISavedPostService {
  private savedPostRepository: ISavedPostRepository;
  private userRepository: IUserRepository;
  private postRepository: IPostRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.savedPostRepository = container.resolve<ISavedPostRepository>('savedPostRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
    this.postRepository = container.resolve<IPostRepository>('postRepository');
  }

  /**
   * Save a post
   */
  async savePost(userId: string, postId: string): Promise<SavedPost> {
    try {
      // Validate user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Validate post exists and is published
      const post = await this.postRepository.findById(postId);
      if (!post || post.status !== 'PUBLISHED' || post.deletedAt) {
        throw new AppError('Post not found or not available', 404, 'POST_NOT_FOUND');
      }

      // Save the post
      return await this.savedPostRepository.savePost(userId, postId);
    } catch (error) {
      this.logger.error(`Error saving post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to save post', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Unsave a post
   */
  async unsavePost(userId: string, postId: string): Promise<boolean> {
    try {
      // Validate user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Unsave the post
      return await this.savedPostRepository.unsavePost(userId, postId);
    } catch (error) {
      this.logger.error(`Error unsaving post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to unsave post', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Toggle saved status
   */
  async toggleSavePost(userId: string, postId: string): Promise<boolean> {
    try {
      const hasSaved = await this.hasSaved(userId, postId);

      if (hasSaved) {
        await this.unsavePost(userId, postId);
        return false; // No longer saved
      } else {
        await this.savePost(userId, postId);
        return true; // Now saved
      }
    } catch (error) {
      this.logger.error(`Error toggling save status: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to toggle save status', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Check if user has saved a post
   */
  async hasSaved(userId: string, postId: string): Promise<boolean> {
    try {
      return await this.savedPostRepository.hasSaved(userId, postId);
    } catch (error) {
      this.logger.error(`Error checking saved status: ${error}`);
      return false;
    }
  }

  /**
   * Get saved posts for a user
   */
  async getSavedPosts(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<SavedPostPaginationResult> {
    try {
      // Validate user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      return await this.savedPostRepository.getSavedPosts(userId, page, limit);
    } catch (error) {
      this.logger.error(`Error getting saved posts: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get saved posts', 500, 'SERVICE_ERROR');
    }
  }
}
