/**
 * Follow relationship entity
 */
export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  status: FollowStatus;
  notifyNewPosts: boolean;
  createdAt: Date;
}

/**
 * Follow status enum
 */
export enum FollowStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

/**
 * Follow with user details
 */
export interface FollowWithDetails extends Follow {
  follower: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl?: string | null;
    artisanProfile?: {
      shopName?: string;
    } | null;
  };
  following: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl?: string | null;
    artisanProfile?: {
      shopName?: string;
    } | null;
  };
}

/**
 * Follow creation DTO
 */
export interface FollowCreateDto {
  followingId: string;
  notifyNewPosts?: boolean;
}

/**
 * Follow pagination result
 */
export interface FollowPaginationResult {
  data: FollowWithDetails[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Follow query options
 */
export interface FollowQueryOptions {
  followerId?: string;
  followingId?: string;
  status?: FollowStatus;
  page?: number;
  limit?: number;
}
