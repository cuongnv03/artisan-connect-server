/**
 * SavedPost entity
 */
export interface SavedPost {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
}

/**
 * SavedPost with post details
 */
export interface SavedPostWithDetails extends SavedPost {
  post: {
    id: string;
    title: string;
    slug?: string | null;
    summary?: string | null;
    thumbnailUrl?: string | null;
    type: string;
    createdAt: Date;
    user: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string | null;
      artisanProfile?: {
        shopName: string;
        isVerified: boolean;
      } | null;
    };
  };
}

/**
 * Save post DTO
 */
export interface SavePostDto {
  postId: string;
}

/**
 * SavedPost pagination result
 */
export interface SavedPostPaginationResult {
  data: SavedPostWithDetails[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
