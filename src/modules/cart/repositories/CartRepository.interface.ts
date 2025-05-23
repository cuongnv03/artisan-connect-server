import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { CartItem, CartSummary, CartValidationResult } from '../models/CartItem';

export interface ICartRepository extends BaseRepository<CartItem, string> {
  addToCart(userId: string, productId: string, quantity: number): Promise<CartItem>;
  updateCartItem(userId: string, productId: string, quantity: number): Promise<CartItem>;
  removeFromCart(userId: string, productId: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;
  getCartItems(userId: string): Promise<CartItem[]>;
  getCartSummary(userId: string): Promise<CartSummary>;
  validateCartItems(userId: string): Promise<CartValidationResult>;
  getCartItemCount(userId: string): Promise<number>;
}
