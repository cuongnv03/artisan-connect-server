import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import {
  Wishlist,
  WishlistWithDetails,
  WishlistPaginationResult,
  WishlistItemType,
} from '../models/Wishlist';

export interface IWishlistRepository extends BaseRepository<Wishlist, string> {
  addToWishlist(userId: string, itemType: WishlistItemType, itemId: string): Promise<Wishlist>;
  removeFromWishlist(userId: string, itemType: WishlistItemType, itemId: string): Promise<boolean>;
  hasInWishlist(userId: string, itemType: WishlistItemType, itemId: string): Promise<boolean>;
  getWishlistItems(
    userId: string,
    itemType?: WishlistItemType,
    page?: number,
    limit?: number,
  ): Promise<WishlistPaginationResult>;
  toggleWishlistItem(userId: string, itemType: WishlistItemType, itemId: string): Promise<boolean>;
}
