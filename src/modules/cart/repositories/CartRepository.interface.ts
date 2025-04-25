import { CartItem, CartWithTotals } from '../models/CartItem';

/**
 * Cart repository interface
 */
export interface ICartRepository {
  /**
   * Add item to cart
   */
  addToCart(userId: string, productId: string, quantity: number): Promise<CartItem>;

  /**
   * Get cart items for a user
   */
  getCartItems(userId: string): Promise<CartItem[]>;

  /**
   * Get cart with calculated totals
   */
  getCartWithTotals(userId: string): Promise<CartWithTotals>;

  /**
   * Update cart item quantity
   */
  updateCartItemQuantity(userId: string, productId: string, quantity: number): Promise<CartItem>;

  /**
   * Remove item from cart
   */
  removeFromCart(userId: string, productId: string): Promise<boolean>;

  /**
   * Clear cart
   */
  clearCart(userId: string): Promise<boolean>;

  /**
   * Check if product is in cart
   */
  isProductInCart(userId: string, productId: string): Promise<boolean>;

  /**
   * Get cart item count
   */
  getCartItemCount(userId: string): Promise<number>;

  /**
   * Validate cart items against inventory
   */
  validateCartItems(userId: string): Promise<{ valid: boolean; invalidItems?: CartItem[] }>;
}
