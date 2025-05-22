export interface SavedPost {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
}

export interface SavedPostWithDetails extends SavedPost {
  post: {
    id: string;
    title: string;
    slug?: string;
    summary?: string;
    thumbnailUrl?: string;
    type: string;
    createdAt: Date;
    user: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
      artisanProfile?: {
        shopName: string;
        isVerified: boolean;
      };
    };
  };
}

export interface SavePostDto {
  postId: string;
}

export interface SavedPostPaginationResult {
  data: SavedPostWithDetails[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
