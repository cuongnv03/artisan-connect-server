import { IWishlistService } from './WishlistService.interface';
import {
  Wishlist,
  WishlistWithDetails,
  WishlistPaginationResult,
  WishlistItemType,
} from '../models/Wishlist';
import { IWishlistRepository } from '../repositories/WishlistRepository.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export class WishlistService implements IWishlistService {
  private wishlistRepository: IWishlistRepository;
  private userRepository: IUserRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.wishlistRepository = container.resolve<IWishlistRepository>('wishlistRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
  }

  async addToWishlist(
    userId: string,
    itemType: WishlistItemType,
    itemId: string,
  ): Promise<Wishlist> {
    try {
      // Validate user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      // Add to wishlist
      const wishlistItem = await this.wishlistRepository.addToWishlist(userId, itemType, itemId);

      this.logger.info(`User ${userId} added ${itemType.toLowerCase()} ${itemId} to wishlist`);

      return wishlistItem;
    } catch (error) {
      this.logger.error(`Error adding to wishlist: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to add to wishlist', 'SERVICE_ERROR');
    }
  }

  async removeFromWishlist(
    userId: string,
    itemType: WishlistItemType,
    itemId: string,
  ): Promise<boolean> {
    try {
      const result = await this.wishlistRepository.removeFromWishlist(userId, itemType, itemId);

      if (result) {
        this.logger.info(
          `User ${userId} removed ${itemType.toLowerCase()} ${itemId} from wishlist`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Error removing from wishlist: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to remove from wishlist', 'SERVICE_ERROR');
    }
  }

  async toggleWishlistItem(
    userId: string,
    itemType: WishlistItemType,
    itemId: string,
  ): Promise<boolean> {
    try {
      const result = await this.wishlistRepository.toggleWishlistItem(userId, itemType, itemId);

      const action = result ? 'added to' : 'removed from';
      this.logger.info(`User ${userId} ${action} wishlist: ${itemType.toLowerCase()} ${itemId}`);

      return result;
    } catch (error) {
      this.logger.error(`Error toggling wishlist item: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to toggle wishlist item', 'SERVICE_ERROR');
    }
  }

  async hasInWishlist(
    userId: string,
    itemType: WishlistItemType,
    itemId: string,
  ): Promise<boolean> {
    try {
      return await this.wishlistRepository.hasInWishlist(userId, itemType, itemId);
    } catch (error) {
      this.logger.error(`Error checking wishlist status: ${error}`);
      return false;
    }
  }

  async getWishlistItems(
    userId: string,
    itemType?: WishlistItemType,
    page: number = 1,
    limit: number = 10,
  ): Promise<WishlistPaginationResult> {
    try {
      // Validate user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      return await this.wishlistRepository.getWishlistItems(userId, itemType, page, limit);
    } catch (error) {
      this.logger.error(`Error getting wishlist items: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get wishlist items', 'SERVICE_ERROR');
    }
  }

  async getWishlistByType(
    userId: string,
    itemType: WishlistItemType,
    page: number = 1,
    limit: number = 10,
  ): Promise<WishlistPaginationResult> {
    try {
      return await this.getWishlistItems(userId, itemType, page, limit);
    } catch (error) {
      this.logger.error(`Error getting wishlist by type: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get wishlist by type', 'SERVICE_ERROR');
    }
  }
}
