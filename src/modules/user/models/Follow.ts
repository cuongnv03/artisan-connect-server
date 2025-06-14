export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  notifyNewPosts: boolean;
  createdAt: Date;
}

export interface FollowWithUser extends Follow {
  follower: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  following: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
}

export interface FollowStatsDto {
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
}
