export enum WishlistItemType {
  PRODUCT = 'PRODUCT',
  POST = 'POST',
}

export interface Wishlist {
  id: string;
  userId: string;
  itemType: WishlistItemType;
  productId?: string | null;
  postId?: string | null;
  createdAt: Date;
}

export interface WishlistWithDetails extends Wishlist {
  product?: {
    id: string;
    name: string;
    slug?: string | null;
    images: string[];
    price: number;
    discountPrice?: number | null;
    status: string;
    avgRating?: number | null;
    reviewCount: number;
    seller: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string | null;
      artisanProfile?: {
        shopName: string;
        isVerified: boolean;
      } | null;
    };
  } | null;
  post?: {
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
  } | null;
}

export interface AddToWishlistDto {
  itemType: WishlistItemType;
  productId?: string;
  postId?: string;
}

export interface WishlistPaginationResult {
  data: WishlistWithDetails[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
