import { ISavedPostService } from './SavedPostService.interface';
import { SavedPost, SavedPostWithDetails, SavedPostPaginationResult } from '../models/SavedPost';
import { ISavedPostRepository } from '../repositories/SavedPostRepository.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { IPostRepository } from '../../post/repositories/PostRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

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

  async savePost(userId: string, postId: string): Promise<SavedPost> {
    try {
      // Validate user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Save the post
      const savedPost = await this.savedPostRepository.savePost(userId, postId);

      this.logger.info(`User ${userId} saved post ${postId}`);

      return savedPost;
    } catch (error) {
      this.logger.error(`Error saving post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to save post', 500, 'SERVICE_ERROR');
    }
  }

  async unsavePost(userId: string, postId: string): Promise<boolean> {
    try {
      const result = await this.savedPostRepository.unsavePost(userId, postId);

      if (result) {
        this.logger.info(`User ${userId} unsaved post ${postId}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error unsaving post: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to unsave post', 500, 'SERVICE_ERROR');
    }
  }

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

  async hasSaved(userId: string, postId: string): Promise<boolean> {
    try {
      return await this.savedPostRepository.hasSaved(userId, postId);
    } catch (error) {
      this.logger.error(`Error checking saved status: ${error}`);
      return false;
    }
  }

  async getSavedPosts(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<SavedPostPaginationResult> {
    try {
      // Validate user exists
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
