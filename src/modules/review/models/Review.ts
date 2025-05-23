/**
 * Review entity
 */
export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number; // 1-5
  title?: string | null;
  comment?: string | null;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Review with user and product info
 */
export interface ReviewWithDetails extends Review {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  product: {
    id: string;
    name: string;
    slug?: string | null;
    images: string[];
    price: number;
    discountPrice?: number | null;
  };
}

/**
 * Create review DTO
 */
export interface CreateReviewDto {
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

/**
 * Update review DTO
 */
export interface UpdateReviewDto {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

/**
 * Review statistics
 */
export interface ReviewStatistics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/**
 * Review filter options
 */
export interface ReviewFilterOptions {
  productId?: string;
  userId?: string;
  rating?: number;
  sortBy?: 'createdAt' | 'rating' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
