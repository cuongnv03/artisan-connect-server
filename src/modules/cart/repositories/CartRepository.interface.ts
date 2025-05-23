import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import {
  CartItem,
  CartSummary,
  CartValidationResult,
  CartAnalytics,
  ProductInCart,
} from '../models/CartItem';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface ICartRepository extends BaseRepository<CartItem, string> {
  /**
   * Cart Item Operations
   */
  addToCart(
    userId: string,
    productId: string,
    quantity: number,
    customizations?: Record<string, any>,
  ): Promise<CartItem>;

  updateCartItem(
    userId: string,
    productId: string,
    quantity: number,
    customizations?: Record<string, any>,
  ): Promise<CartItem>;

  removeFromCart(userId: string, productId: string): Promise<boolean>;

  clearCart(userId: string): Promise<boolean>;

  getCartItems(userId: string): Promise<CartItem[]>;

  getCartItem(userId: string, productId: string): Promise<CartItem | null>;

  /**
   * Cart Summary & Calculations
   */
  getCartSummary(userId: string): Promise<CartSummary>;

  calculateCartTotals(cartItems: CartItem[]): Promise<{
    subtotal: number;
    totalDiscount: number;
    total: number;
    itemCount: number;
    totalQuantity: number;
  }>;

  /**
   * Cart Validation
   */
  validateCartItems(userId: string): Promise<CartValidationResult>;

  validateSingleItem(
    userId: string,
    productId: string,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    productInfo?: ProductInCart;
  }>;

  /**
   * Bulk Operations
   */
  bulkUpdateCart(
    userId: string,
    updates: Array<{
      productId: string;
      quantity: number;
      customizations?: Record<string, any>;
    }>,
  ): Promise<CartItem[]>;

  bulkRemoveFromCart(userId: string, productIds: string[]): Promise<boolean>;

  /**
   * Cart Merge (for login scenarios)
   */
  mergeGuestCart(
    userId: string,
    guestCartItems: Array<{
      productId: string;
      quantity: number;
      customizations?: Record<string, any>;
    }>,
  ): Promise<CartItem[]>;

  /**
   * Cart Analytics & Stats
   */
  getCartAnalytics(userId: string): Promise<CartAnalytics>;

  getCartItemCount(userId: string): Promise<number>;

  getCartTotalValue(userId: string): Promise<number>;

  /**
   * Product Availability Checks
   */
  checkProductAvailability(
    productId: string,
    requestedQuantity: number,
  ): Promise<{
    available: boolean;
    currentStock: number;
    isActive: boolean;
  }>;

  getOutOfStockItems(userId: string): Promise<CartItem[]>;

  /**
   * Cart History & Cleanup
   */
  getRecentlyRemovedItems(userId: string, days?: number): Promise<CartItem[]>;

  cleanupExpiredCarts(olderThanDays: number): Promise<number>;

  /**
   * Advanced Queries
   */
  getCartsByProduct(productId: string): Promise<{ userId: string; quantity: number }[]>;

  getPopularCartItems(limit?: number): Promise<
    Array<{
      productId: string;
      productName: string;
      totalQuantity: number;
      uniqueUsers: number;
    }>
  >;

  /**
   * Cart Sharing & Wishlist Integration
   */
  saveItemForLater(userId: string, productId: string): Promise<boolean>;

  moveFromSavedToCart(userId: string, productId: string, quantity: number): Promise<CartItem>;

  getSavedItems(userId: string): Promise<CartItem[]>;
}
