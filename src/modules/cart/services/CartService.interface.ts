import {
  CartItem,
  CartSummary,
  CartValidationResult,
  CartAnalytics,
  AddToCartDto,
  UpdateCartItemDto,
  BulkUpdateCartDto,
  CartMergeDto,
} from '../models/CartItem';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface ICartService {
  /**
   * Core Cart Operations
   */
  addToCart(userId: string, data: AddToCartDto): Promise<CartItem>;

  updateCartItem(userId: string, productId: string, data: UpdateCartItemDto): Promise<CartItem>;

  removeFromCart(userId: string, productId: string): Promise<boolean>;

  clearCart(userId: string): Promise<boolean>;

  getCartItems(userId: string): Promise<CartItem[]>;

  getCartSummary(userId: string): Promise<CartSummary>;

  /**
   * Cart Validation
   */
  validateCart(userId: string): Promise<CartValidationResult>;

  validateForCheckout(userId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    summary?: CartSummary;
  }>;

  /**
   * Bulk Operations
   */
  bulkUpdateCart(userId: string, data: BulkUpdateCartDto): Promise<CartItem[]>;

  bulkRemoveFromCart(userId: string, productIds: string[]): Promise<boolean>;

  /**
   * Cart Management
   */
  mergeGuestCart(
    userId: string,
    data: CartMergeDto,
  ): Promise<{
    mergedItems: CartItem[];
    skippedItems: Array<{ productId: string; reason: string }>;
    summary: CartSummary;
  }>;

  /**
   * Cart Analytics & Insights
   */
  getCartAnalytics(userId: string): Promise<CartAnalytics>;

  getCartItemCount(userId: string): Promise<number>;

  getCartValue(userId: string): Promise<number>;

  /**
   * Advanced Features
   */
  saveItemForLater(userId: string, productId: string): Promise<boolean>;

  moveToCartFromSaved(userId: string, productId: string, quantity?: number): Promise<CartItem>;

  getSavedItems(userId: string): Promise<CartItem[]>;

  /**
   * Cart Optimization
   */
  optimizeCart(userId: string): Promise<{
    removedItems: CartItem[];
    updatedItems: CartItem[];
    savings: number;
    recommendations: string[];
  }>;

  /**
   * Price & Stock Monitoring
   */
  checkPriceChanges(userId: string): Promise<
    Array<{
      productId: string;
      productName: string;
      oldPrice: number;
      newPrice: number;
      changeType: 'increase' | 'decrease';
      changeAmount: number;
      changePercentage: number;
    }>
  >;

  /**
   * Cart Sharing & Export
   */
  generateCartShareLink(userId: string, expirationHours?: number): Promise<string>;

  exportCart(userId: string, format: 'json' | 'csv'): Promise<string>;

  /**
   * Cart Recommendations
   */
  getCartRecommendations(userId: string): Promise<
    Array<{
      type: 'bundle' | 'similar' | 'frequently_bought_together' | 'price_match';
      products: Array<{
        id: string;
        name: string;
        price: number;
        reason: string;
      }>;
      potentialSavings?: number;
    }>
  >;

  /**
   * Maintenance Operations
   */
  syncCartPrices(userId: string): Promise<{
    updatedItems: number;
    priceChanges: Array<{
      productId: string;
      oldPrice: number;
      newPrice: number;
    }>;
  }>;

  refreshCartData(userId: string): Promise<CartSummary>;
}
