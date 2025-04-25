/**
 * Like entity
 */
export interface Like {
  id: string;
  userId: string;
  postId?: string | null;
  commentId?: string | null;
  reaction: ReactionType;
  createdAt: Date;
}

/**
 * Reaction type enum
 */
export enum ReactionType {
  LIKE = 'like',
  HEART = 'heart',
  CLAP = 'clap',
}

/**
 * Like with user details
 */
export interface LikeWithUser extends Like {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl?: string | null;
  };
}

/**
 * Create like DTO
 */
export interface CreateLikeDto {
  postId?: string;
  commentId?: string;
  reaction?: ReactionType;
}

/**
 * Like pagination result
 */
export interface LikePaginationResult {
  data: LikeWithUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
