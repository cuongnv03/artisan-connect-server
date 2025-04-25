import { IFollowService } from './FollowService.interface';
import { EventBus } from '../../../core/events/EventBus';
import {
  Follow,
  FollowWithDetails,
  FollowStatus,
  FollowQueryOptions,
  FollowPaginationResult,
} from '../domain/entities/Follow';
import { IFollowRepository } from '../domain/repositories/FollowRepository.interface';
import { IUserRepository } from '../../user/domain/repositories/UserRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export class FollowService implements IFollowService {
  private followRepository: IFollowRepository;
  private userRepository: IUserRepository;
  private logger = Logger.getInstance();
  private eventBus = EventBus.getInstance();

  constructor() {
    this.followRepository = container.resolve<IFollowRepository>('followRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
  }

  /**
   * Follow a user
   */
  async followUser(
    followerId: string,
    followingId: string,
    notifyNewPosts: boolean = true,
  ): Promise<Follow> {
    try {
      // Validate users
      const [follower, following] = await Promise.all([
        this.userRepository.findById(followerId),
        this.userRepository.findById(followingId),
      ]);

      if (!follower) {
        throw new AppError('Follower user not found', 404, 'USER_NOT_FOUND');
      }

      if (!following) {
        throw new AppError('User to follow not found', 404, 'USER_NOT_FOUND');
      }

      // Create follow relationship
      const follow = await this.followRepository.createFollow(
        followerId,
        followingId,
        notifyNewPosts,
      );

      // Emit event
      this.eventBus.publish('user.followed', {
        followerId,
        followerName: `${follower.firstName} ${follower.lastName}`,
        followingId,
        followingName: `${following.firstName} ${following.lastName}`,
      });

      return follow;
    } catch (error) {
      this.logger.error(`Error following user: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to follow user', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      return await this.followRepository.removeFollow(followerId, followingId);
    } catch (error) {
      this.logger.error(`Error unfollowing user: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to unfollow user', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreference(
    followerId: string,
    followingId: string,
    notify: boolean,
  ): Promise<Follow> {
    try {
      return await this.followRepository.updateNotificationPreference(
        followerId,
        followingId,
        notify,
      );
    } catch (error) {
      this.logger.error(`Error updating notification preference: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update notification preference', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Check if user is following another user
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const follow = await this.followRepository.checkFollowExists(followerId, followingId);
      return !!follow && follow.status === FollowStatus.ACCEPTED;
    } catch (error) {
      this.logger.error(`Error checking follow status: ${error}`);
      return false;
    }
  }

  /**
   * Get follow relationship details
   */
  async getFollowDetails(
    followerId: string,
    followingId: string,
  ): Promise<FollowWithDetails | null> {
    try {
      return await this.followRepository.getFollow(followerId, followingId);
    } catch (error) {
      this.logger.error(`Error getting follow details: ${error}`);
      return null;
    }
  }

  /**
   * Get user's followers
   */
  async getFollowers(
    userId: string,
    options?: FollowQueryOptions,
  ): Promise<FollowPaginationResult> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      return await this.followRepository.getFollowers(userId, options);
    } catch (error) {
      this.logger.error(`Error getting followers: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get followers', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(
    userId: string,
    options?: FollowQueryOptions,
  ): Promise<FollowPaginationResult> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      return await this.followRepository.getFollowing(userId, options);
    } catch (error) {
      this.logger.error(`Error getting following: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get following', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get follow count
   */
  async getFollowCount(userId: string): Promise<{ followerCount: number; followingCount: number }> {
    try {
      return await this.followRepository.getFollowCount(userId);
    } catch (error) {
      this.logger.error(`Error getting follow count: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get follow count', 500, 'SERVICE_ERROR');
    }
  }
}
