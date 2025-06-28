import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { CartItem, CartSummary, CartValidationResult } from '../models/CartItem';

export interface ICartRepository extends BaseRepository<CartItem, string> {
  addToCart(
    userId: string,
    productId: string,
    quantity: number,
    variantId?: string,
    negotiationId?: string,
  ): Promise<CartItem>;
  addNegotiatedItemToCart(
    userId: string,
    negotiationId: string,
    quantity?: number,
  ): Promise<CartItem>;
  updateCartItem(
    userId: string,
    productId: string,
    quantity: number,
    variantId?: string,
  ): Promise<CartItem>;
  removeFromCart(userId: string, productId: string, variantId?: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;
  getCartItems(userId: string): Promise<CartItem[]>;
  getCartSummary(userId: string): Promise<CartSummary>;
  validateCartItems(userId: string): Promise<CartValidationResult>;
  getCartItemCount(userId: string): Promise<number>;
}
