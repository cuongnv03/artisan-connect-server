import { ICartService } from './CartService.interface';
import {
  CartItem,
  CartSummary,
  CartValidationResult,
  AddToCartDto,
  UpdateCartItemDto,
} from '../models/CartItem';
import { ICartRepository } from '../repositories/CartRepository.interface';
import { IProductRepository } from '../../product/repositories/ProductRepository.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
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

  async addToCart(userId: string, data: AddToCartDto): Promise<CartItem> {
    try {
      // Validate user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Basic validation
      if (data.quantity <= 0 || data.quantity > 10) {
        throw new AppError('Quantity must be between 1 and 10', 400, 'INVALID_QUANTITY');
      }

      // Check cart item limit
      const currentItemCount = await this.cartRepository.getCartItemCount(userId);
      if (currentItemCount >= 50) {
        throw new AppError('Cart is full. Maximum 50 items allowed', 400, 'CART_LIMIT_EXCEEDED');
      }

      const cartItem = await this.cartRepository.addToCart(
        userId,
        data.productId,
        data.quantity,
        data.variantId,
      );

      this.logger.info(
        `User ${userId} added ${data.quantity}x product ${data.productId}${data.variantId ? ` variant ${data.variantId}` : ''} to cart`,
      );

      return this.convertCartItemForApi(cartItem);
    } catch (error) {
      this.logger.error(`Error adding to cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add item to cart', 500, 'SERVICE_ERROR');
    }
  }

  async updateCartItem(
    userId: string,
    productId: string,
    data: UpdateCartItemDto,
    variantId?: string,
  ): Promise<CartItem> {
    try {
      if (data.quantity <= 0 || data.quantity > 10) {
        throw new AppError('Quantity must be between 1 and 10', 400, 'INVALID_QUANTITY');
      }

      const updatedItem = await this.cartRepository.updateCartItem(
        userId,
        productId,
        data.quantity,
        variantId,
      );

      this.logger.info(
        `User ${userId} updated product ${productId}${variantId ? ` variant ${variantId}` : ''} quantity to ${data.quantity}`,
      );

      return this.convertCartItemForApi(updatedItem);
    } catch (error) {
      this.logger.error(`Error updating cart item: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update cart item', 500, 'SERVICE_ERROR');
    }
  }

  async removeFromCart(userId: string, productId: string, variantId?: string): Promise<boolean> {
    try {
      const result = await this.cartRepository.removeFromCart(userId, productId, variantId);

      if (result) {
        this.logger.info(
          `User ${userId} removed product ${productId}${variantId ? ` variant ${variantId}` : ''} from cart`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Error removing from cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to remove item from cart', 500, 'SERVICE_ERROR');
    }
  }

  async clearCart(userId: string): Promise<boolean> {
    try {
      const result = await this.cartRepository.clearCart(userId);

      if (result) {
        this.logger.info(`User ${userId} cleared their cart`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error clearing cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to clear cart', 500, 'SERVICE_ERROR');
    }
  }

  async getCartItems(userId: string): Promise<CartItem[]> {
    try {
      const items = await this.cartRepository.getCartItems(userId);
      return items.map((item) => this.convertCartItemForApi(item));
    } catch (error) {
      this.logger.error(`Error getting cart items: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get cart items', 500, 'SERVICE_ERROR');
    }
  }

  async getCartSummary(userId: string): Promise<CartSummary> {
    try {
      const summary = await this.cartRepository.getCartSummary(userId);

      // Convert Decimal to number for API response
      return {
        ...summary,
        items: summary.items.map((item) => this.convertCartItemForApi(item)),
      };
    } catch (error) {
      this.logger.error(`Error getting cart summary: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get cart summary', 500, 'SERVICE_ERROR');
    }
  }

  async getCartItemCount(userId: string): Promise<number> {
    try {
      return await this.cartRepository.getCartItemCount(userId);
    } catch (error) {
      this.logger.error(`Error getting cart item count: ${error}`);
      return 0;
    }
  }

  async validateCart(userId: string): Promise<CartValidationResult> {
    try {
      const validationResult = await this.cartRepository.validateCartItems(userId);

      // Add additional business validations
      const cartItems = await this.cartRepository.getCartItems(userId);

      // Check for minimum order requirements
      const totalValue = cartItems.reduce((sum, item) => {
        const currentPrice =
          item.variant?.discountPrice ||
          item.variant?.price ||
          item.product!.discountPrice ||
          item.product!.price;
        const price = Number(currentPrice);
        return sum + price * item.quantity;
      }, 0);

      if (totalValue < 5) {
        // Minimum $5 order
        validationResult.errors.push({
          type: 'INVALID_QUANTITY',
          productId: '',
          productName: '',
          message: `Minimum order value is $5. Current total: $${totalValue.toFixed(2)}`,
        });
        validationResult.isValid = false;
      }

      return validationResult;
    } catch (error) {
      this.logger.error(`Error validating cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to validate cart', 500, 'SERVICE_ERROR');
    }
  }

  async validateForCheckout(userId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    summary?: CartSummary;
  }> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Get cart validation
      const validation = await this.validateCart(userId);
      const summary = await this.getCartSummary(userId);

      // Collect errors from validation
      validation.errors.forEach((error) => {
        errors.push(error.message);
      });

      // Collect warnings
      validation.warnings.forEach((warning) => {
        warnings.push(warning.message);
      });

      // Additional checkout validations
      if (summary.items.length === 0) {
        errors.push('Cart is empty');
      }

      // Check if all products are from verified sellers (business rule)
      const unverifiedSellers = summary.groupedBySeller.filter(
        (group) => !group.sellerInfo.isVerified,
      );

      if (unverifiedSellers.length > 0) {
        warnings.push(
          `Some items are from unverified sellers: ${unverifiedSellers
            .map((s) => s.sellerInfo.name)
            .join(', ')}`,
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        summary: summary,
      };
    } catch (error) {
      this.logger.error(`Error validating cart for checkout: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to validate cart for checkout', 500, 'SERVICE_ERROR');
    }
  }

  // Helper method to convert Decimal to number for API responses
  private convertCartItemForApi(item: CartItem): CartItem {
    return {
      ...item,
      price: Number(item.price),
      product: item.product
        ? {
            ...item.product,
            price: Number(item.product.price),
            discountPrice: item.product.discountPrice ? Number(item.product.discountPrice) : null,
          }
        : undefined,
      variant: item.variant
        ? {
            ...item.variant,
            price: Number(item.variant.price),
            discountPrice: item.variant.discountPrice ? Number(item.variant.discountPrice) : null,
          }
        : undefined,
    };
  }
}
