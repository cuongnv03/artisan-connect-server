import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { Follow, FollowWithUser, FollowStatsDto } from '../models/Follow';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IFollowRepository extends BaseRepository<Follow, string> {
  findByFollowerAndFollowing(followerId: string, followingId: string): Promise<Follow | null>;
  createFollow(followerId: string, followingId: string): Promise<Follow>;
  removeFollow(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<FollowWithUser>>;
  getFollowing(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<FollowWithUser>>;
  getFollowStats(userId: string, currentUserId?: string): Promise<FollowStatsDto>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  updateFollowCounts(userId: string): Promise<void>;
}
