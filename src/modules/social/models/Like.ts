export interface Like {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  createdAt: Date;
}

export interface LikeWithUser extends Like {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl?: string;
  };
}

export interface CreateLikeDto {
  postId?: string;
  commentId?: string;
}

export interface LikePaginationResult {
  data: LikeWithUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
