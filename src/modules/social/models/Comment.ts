export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId?: string;
  content: string;
  mediaUrl?: string;
  likeCount: number;
  replyCount: number;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CommentWithUser extends Comment {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl?: string;
  };
  isLiked?: boolean;
  replies?: CommentWithUser[];
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface CreateCommentDto {
  postId: string;
  parentId?: string;
  content: string;
  mediaUrl?: string;
}

export interface UpdateCommentDto {
  content?: string;
  mediaUrl?: string;
}

export interface CommentQueryOptions {
  postId?: string;
  userId?: string;
  parentId?: string | null;
  page?: number;
  limit?: number;
  includeLikeStatus?: boolean;
  includeReplies?: boolean;
  sortBy?: 'createdAt' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
}

export interface CommentPaginationResult {
  data: CommentWithUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
