import { BaseRepository } from '../../../../shared/interfaces/BaseRepository';
import {
  Follow,
  FollowWithDetails,
  FollowStatus,
  FollowQueryOptions,
  FollowPaginationResult,
} from '../entities/Follow';

export interface IFollowRepository extends BaseRepository<Follow, string> {
  /**
   * Create follow relationship
   */
  createFollow(followerId: string, followingId: string, notifyNewPosts?: boolean): Promise<Follow>;

  /**
   * Delete follow relationship
   */
  removeFollow(followerId: string, followingId: string): Promise<boolean>;

  /**
   * Update follow status
   */
  updateFollowStatus(id: string, status: FollowStatus): Promise<Follow>;

  /**
   * Update notification preference
   */
  updateNotificationPreference(
    followerId: string,
    followingId: string,
    notify: boolean,
  ): Promise<Follow>;

  /**
   * Check if follow relationship exists
   */
  checkFollowExists(followerId: string, followingId: string): Promise<Follow | null>;

  /**
   * Get follow relationship
   */
  getFollow(followerId: string, followingId: string): Promise<FollowWithDetails | null>;

  /**
   * Get followers with pagination
   */
  getFollowers(userId: string, options?: FollowQueryOptions): Promise<FollowPaginationResult>;

  /**
   * Get following with pagination
   */
  getFollowing(userId: string, options?: FollowQueryOptions): Promise<FollowPaginationResult>;

  /**
   * Get follow count
   */
  getFollowCount(userId: string): Promise<{ followerCount: number; followingCount: number }>;
}
