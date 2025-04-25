/**
 * Comment entity
 */
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId?: string | null;
  content: string;
  mediaUrl?: string | null;
  likeCount: number;
  replyCount: number;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Comment with user details
 */
export interface CommentWithUser extends Comment {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl?: string | null;
  };
  liked?: boolean; // If the requesting user has liked this comment
  replies?: CommentWithUser[]; // For nested comments, optional
}

/**
 * Create comment DTO
 */
export interface CreateCommentDto {
  postId: string;
  parentId?: string | null;
  content: string;
  mediaUrl?: string | null;
}

/**
 * Update comment DTO
 */
export interface UpdateCommentDto {
  content?: string;
  mediaUrl?: string | null;
}

/**
 * Comment query options
 */
export interface CommentQueryOptions {
  postId?: string;
  userId?: string;
  parentId?: string | null; // Null means top-level comments only
  page?: number;
  limit?: number;
  includeLikeStatus?: boolean;
  includeReplies?: boolean;
  includeDeletedParent?: boolean; // Include comments where parent was deleted
}

/**
 * Comment pagination result
 */
export interface CommentPaginationResult {
  data: CommentWithUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
