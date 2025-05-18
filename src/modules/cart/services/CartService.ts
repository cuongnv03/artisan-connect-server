import { ICartService } from './CartService.interface';
import { CartItem, CartWithTotals, AddToCartDto, UpdateCartItemDto } from '../models/CartItem';
import { ICartRepository } from '../repositories/CartRepository.interface';
import { IProductRepository } from '../../product/repositories/ProductRepository.interface';
import { IUserRepository } from '../../user/repositories/UserRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import container from '../../../core/di/container';

export class CartService implements ICartService {
  private cartRepository: ICartRepository;
  private productRepository: IProductRepository;
  private userRepository: IUserRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.cartRepository = container.resolve<ICartRepository>('cartRepository');
    this.productRepository = container.resolve<IProductRepository>('productRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
  }

  /**
   * Add item to cart
   */
  async addToCart(userId: string, data: AddToCartDto): Promise<CartItem> {
    try {
      // Validate user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Validate product
      const product = await this.productRepository.findByIdWithDetails(data.productId);
      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.status !== 'PUBLISHED') {
        throw new AppError('Product is not available for purchase', 400, 'PRODUCT_UNAVAILABLE');
      }

      // Validate quantity
      if (data.quantity <= 0) {
        throw new AppError('Quantity must be greater than 0', 400, 'INVALID_QUANTITY');
      }

      // Validate stock
      if (product.quantity < data.quantity) {
        throw new AppError(
          `Not enough stock. Only ${product.quantity} available.`,
          400,
          'INSUFFICIENT_STOCK',
        );
      }

      // Add to cart
      const cartItem = await this.cartRepository.addToCart(userId, data.productId, data.quantity);

      this.logger.info(
        `User ${userId} added product ${data.productId} (quantity: ${data.quantity}) to cart`,
      );

      return cartItem;
    } catch (error) {
      this.logger.error(`Error adding to cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add item to cart', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get cart items for a user
   */
  async getCartItems(userId: string): Promise<CartItem[]> {
    try {
      return await this.cartRepository.getCartItems(userId);
    } catch (error) {
      this.logger.error(`Error getting cart items: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get cart items', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get cart with calculated totals
   */
  async getCartWithTotals(userId: string): Promise<CartWithTotals> {
    try {
      return await this.cartRepository.getCartWithTotals(userId);
    } catch (error) {
      this.logger.error(`Error getting cart with totals: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get cart with totals', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItemQuantity(
    userId: string,
    productId: string,
    data: UpdateCartItemDto,
  ): Promise<CartItem> {
    try {
      // Validate product
      const product = await this.productRepository.findByIdWithDetails(productId);
      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      // Validate quantity
      if (data.quantity < 0) {
        throw new AppError('Quantity cannot be negative', 400, 'INVALID_QUANTITY');
      }

      // If quantity is 0, remove item from cart
      if (data.quantity === 0) {
        await this.cartRepository.removeFromCart(userId, productId);
        this.logger.info(
          `User ${userId} removed product ${productId} from cart by setting quantity to 0`,
        );
        throw new AppError('Item removed from cart', 200, 'ITEM_REMOVED');
      }

      // Validate stock
      if (product.quantity < data.quantity) {
        throw new AppError(
          `Not enough stock. Only ${product.quantity} available.`,
          400,
          'INSUFFICIENT_STOCK',
        );
      }

      // Update cart item
      const cartItem = await this.cartRepository.updateCartItemQuantity(
        userId,
        productId,
        data.quantity,
      );

      this.logger.info(
        `User ${userId} updated quantity of product ${productId} to ${data.quantity} in cart`,
      );

      return cartItem;
    } catch (error) {
      this.logger.error(`Error updating cart item quantity: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update cart item', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId: string, productId: string): Promise<boolean> {
    try {
      const result = await this.cartRepository.removeFromCart(userId, productId);

      if (result) {
        this.logger.info(`User ${userId} removed product ${productId} from cart`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error removing item from cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to remove item from cart', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string): Promise<boolean> {
    try {
      const result = await this.cartRepository.clearCart(userId);

      if (result) {
        this.logger.info(`User ${userId} cleared their entire cart`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error clearing cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to clear cart', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(userId: string): Promise<number> {
    try {
      return await this.cartRepository.getCartItemCount(userId);
    } catch (error) {
      this.logger.error(`Error getting cart item count: ${error}`);
      return 0;
    }
  }

  /**
   * Validate cart before checkout
   */
  async validateCartForCheckout(
    userId: string,
  ): Promise<{ valid: boolean; message?: string; invalidItems?: CartItem[] }> {
    try {
      // Get cart
      const cart = await this.cartRepository.getCartWithTotals(userId);

      // Check if cart is empty
      if (cart.items.length === 0) {
        return {
          valid: false,
          message: 'Your cart is empty',
        };
      }

      // Validate inventory
      const result = await this.cartRepository.validateCartItems(userId);

      if (!result.valid) {
        this.logger.info(
          `Cart validation failed for user ${userId}: Some items out of stock or unavailable`,
        );
        return {
          valid: false,
          message: 'Some items in your cart are out of stock or unavailable',
          invalidItems: result.invalidItems,
        };
      }

      this.logger.info(`Cart validation successful for user ${userId}`);
      return { valid: true };
    } catch (error) {
      this.logger.error(`Error validating cart for checkout: ${error}`);
      throw new AppError('Failed to validate cart for checkout', 500, 'SERVICE_ERROR');
    }
  }
}
