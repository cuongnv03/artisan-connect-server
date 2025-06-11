import {
  CartItem,
  CartSummary,
  CartValidationResult,
  AddToCartDto,
  UpdateCartItemDto,
} from '../models/CartItem';

export interface ICartService {
  // Core operations
  addToCart(userId: string, data: AddToCartDto): Promise<CartItem>;
  updateCartItem(
    userId: string,
    productId: string,
    data: UpdateCartItemDto,
    variantId?: string,
  ): Promise<CartItem>;
  removeFromCart(userId: string, productId: string, variantId?: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;

  // Get cart data
  getCartItems(userId: string): Promise<CartItem[]>;
  getCartSummary(userId: string): Promise<CartSummary>;
  getCartItemCount(userId: string): Promise<number>;

  // Validation
  validateCart(userId: string): Promise<CartValidationResult>;

  // Checkout preparation
  validateForCheckout(userId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    summary?: CartSummary;
  }>;
}
