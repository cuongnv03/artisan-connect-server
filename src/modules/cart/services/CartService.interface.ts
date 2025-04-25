import { CartItem, CartWithTotals, AddToCartDto, UpdateCartItemDto } from '../models/CartItem';

export interface ICartService {
  /**
   * Add item to cart
   */
  addToCart(userId: string, data: AddToCartDto): Promise<CartItem>;

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
  updateCartItemQuantity(
    userId: string,
    productId: string,
    data: UpdateCartItemDto,
  ): Promise<CartItem>;

  /**
   * Remove item from cart
   */
  removeFromCart(userId: string, productId: string): Promise<boolean>;

  /**
   * Clear cart
   */
  clearCart(userId: string): Promise<boolean>;

  /**
   * Get cart item count
   */
  getCartItemCount(userId: string): Promise<number>;

  /**
   * Validate cart before checkout
   */
  validateCartForCheckout(
    userId: string,
  ): Promise<{ valid: boolean; message?: string; invalidItems?: CartItem[] }>;
}
