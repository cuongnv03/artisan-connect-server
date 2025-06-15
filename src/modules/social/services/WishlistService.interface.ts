import {
  Wishlist,
  WishlistWithDetails,
  WishlistPaginationResult,
  WishlistItemType,
} from '../models/Wishlist';

export interface IWishlistService {
  addToWishlist(userId: string, itemType: WishlistItemType, itemId: string): Promise<Wishlist>;
  removeFromWishlist(userId: string, itemType: WishlistItemType, itemId: string): Promise<boolean>;
  toggleWishlistItem(userId: string, itemType: WishlistItemType, itemId: string): Promise<boolean>;
  hasInWishlist(userId: string, itemType: WishlistItemType, itemId: string): Promise<boolean>;
  getWishlistItems(
    userId: string,
    itemType?: WishlistItemType,
    page?: number,
    limit?: number,
  ): Promise<WishlistPaginationResult>;
  getWishlistByType(
    userId: string,
    itemType: WishlistItemType,
    page?: number,
    limit?: number,
  ): Promise<WishlistPaginationResult>;
}
