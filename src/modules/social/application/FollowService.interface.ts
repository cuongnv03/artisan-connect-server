import {
  Follow,
  FollowWithDetails,
  FollowStatus,
  FollowQueryOptions,
  FollowPaginationResult,
} from '../domain/entities/Follow';

export interface IFollowService {
  /**
   * Follow a user
   */
  followUser(followerId: string, followingId: string, notifyNewPosts?: boolean): Promise<Follow>;

  /**
   * Unfollow a user
   */
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;

  /**
   * Update notification preferences
   */
  updateNotificationPreference(
    followerId: string,
    followingId: string,
    notify: boolean,
  ): Promise<Follow>;

  /**
   * Check if user is following another user
   */
  isFollowing(followerId: string, followingId: string): Promise<boolean>;

  /**
   * Get follow relationship details
   */
  getFollowDetails(followerId: string, followingId: string): Promise<FollowWithDetails | null>;

  /**
   * Get user's followers
   */
  getFollowers(userId: string, options?: FollowQueryOptions): Promise<FollowPaginationResult>;

  /**
   * Get users that a user is following
   */
  getFollowing(userId: string, options?: FollowQueryOptions): Promise<FollowPaginationResult>;

  /**
   * Get follow count
   */
  getFollowCount(userId: string): Promise<{ followerCount: number; followingCount: number }>;
}
