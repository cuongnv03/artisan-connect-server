import { ICartService } from './CartService.interface';
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
import { ICartRepository } from '../repositories/CartRepository.interface';
import { IProductRepository } from '../../product/repositories/ProductRepository.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { BaseService } from '../../../shared/baseClasses/BaseService';
import { AppError } from '../../../core/errors/AppError';
import { Validators } from '../../../shared/utils/Validators';
import container from '../../../core/di/container';

export class CartService extends BaseService implements ICartService {
  private cartRepository: ICartRepository;
  private productRepository: IProductRepository;
  private userRepository: IUserRepository;

  constructor() {
    super([
      { methodName: 'addToCart', errorMessage: 'Failed to add item to cart' },
      { methodName: 'updateCartItem', errorMessage: 'Failed to update cart item' },
      { methodName: 'validateCart', errorMessage: 'Failed to validate cart' },
      { methodName: 'bulkUpdateCart', errorMessage: 'Failed to bulk update cart' },
    ]);

    this.cartRepository = container.resolve<ICartRepository>('cartRepository');
    this.productRepository = container.resolve<IProductRepository>('productRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
  }

  /**
   * Add item to cart with business logic validation
   */
  async addToCart(userId: string, data: AddToCartDto): Promise<CartItem> {
    // Validate user exists
    const user = await this.userRepository.findById(userId);
    Validators.validateExists(user, 'User', userId);

    // Validate product
    const product = await this.productRepository.findByIdWithDetails(data.productId);
    Validators.validateExists(product, 'Product', data.productId);

    // Business rules validation
    if (product!.status !== 'PUBLISHED') {
      throw AppError.badRequest('Product is not available for purchase', 'PRODUCT_UNAVAILABLE');
    }

    if (product!.sellerId === userId) {
      throw AppError.badRequest(
        'You cannot add your own product to cart',
        'CANNOT_BUY_OWN_PRODUCT',
      );
    }

    Validators.validatePositiveNumber(data.quantity, 'Quantity');

    if (data.quantity > 10) {
      throw AppError.badRequest('Maximum 10 items per product allowed', 'QUANTITY_LIMIT_EXCEEDED');
    }

    // Check if user already has too many items in cart
    const currentItemCount = await this.cartRepository.getCartItemCount(userId);
    if (currentItemCount >= 100) {
      throw AppError.badRequest('Cart is full. Maximum 100 items allowed', 'CART_LIMIT_EXCEEDED');
    }

    // Add to cart
    const cartItem = await this.cartRepository.addToCart(
      userId,
      data.productId,
      data.quantity,
      data.customizations,
    );

    this.logger.info(`User ${userId} added ${data.quantity}x product ${data.productId} to cart`);

    return cartItem;
  }

  /**
   * Update cart item with validation
   */
  async updateCartItem(
    userId: string,
    productId: string,
    data: UpdateCartItemDto,
  ): Promise<CartItem> {
    // Validate cart item exists
    const existingItem = await this.cartRepository.getCartItem(userId, productId);
    Validators.validateExists(existingItem, 'Cart item', productId);

    Validators.validatePositiveNumber(data.quantity, 'Quantity');

    if (data.quantity > 10) {
      throw AppError.badRequest('Maximum 10 items per product allowed', 'QUANTITY_LIMIT_EXCEEDED');
    }

    const updatedItem = await this.cartRepository.updateCartItem(
      userId,
      productId,
      data.quantity,
      data.customizations,
    );

    this.logger.info(`User ${userId} updated product ${productId} quantity to ${data.quantity}`);

    return updatedItem;
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId: string, productId: string): Promise<boolean> {
    const result = await this.cartRepository.removeFromCart(userId, productId);

    if (result) {
      this.logger.info(`User ${userId} removed product ${productId} from cart`);
    }

    return result;
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: string): Promise<boolean> {
    const result = await this.cartRepository.clearCart(userId);

    if (result) {
      this.logger.info(`User ${userId} cleared their cart`);
    }

    return result;
  }

  /**
   * Get cart items
   */
  async getCartItems(userId: string): Promise<CartItem[]> {
    return await this.cartRepository.getCartItems(userId);
  }

  /**
   * Get cart summary with enhanced calculations
   */
  async getCartSummary(userId: string): Promise<CartSummary> {
    const summary = await this.cartRepository.getCartSummary(userId);

    // Add business logic enhancements
    summary.estimatedShipping = this.calculateEstimatedShipping(summary);

    return summary;
  }

  /**
   * Validate cart comprehensively
   */
  async validateCart(userId: string): Promise<CartValidationResult> {
    const validationResult = await this.cartRepository.validateCartItems(userId);

    // Add additional business validations
    const cartItems = await this.cartRepository.getCartItems(userId);

    // Check for minimum order requirements
    const totalValue = cartItems.reduce((sum, item) => {
      const price = item.product!.discountPrice || item.product!.price;
      return sum + price * item.quantity;
    }, 0);

    if (totalValue < 10) {
      // Minimum $10 order
      validationResult.errors.push({
        type: 'INVALID_QUANTITY',
        productId: '',
        productName: '',
        message: `Minimum order value is $10. Current total: $${totalValue.toFixed(2)}`,
        currentQuantity: 0,
      });
      validationResult.isValid = false;
    }

    return validationResult;
  }

  /**
   * Validate cart for checkout readiness
   */
  async validateForCheckout(userId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    summary?: CartSummary;
  }> {
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

    // Check if user has valid payment method (would integrate with payment service)
    // if (!await this.hasValidPaymentMethod(userId)) {
    //   errors.push('No valid payment method found');
    // }

    // Check if user has shipping address (would integrate with user service)
    // if (!await this.hasShippingAddress(userId)) {
    //   warnings.push('No shipping address set');
    // }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: summary,
    };
  }

  /**
   * Bulk update cart items
   */
  async bulkUpdateCart(userId: string, data: BulkUpdateCartDto): Promise<CartItem[]> {
    // Validate each update
    for (const item of data.items) {
      if (item.quantity < 0) {
        throw AppError.badRequest(
          `Invalid quantity for product ${item.productId}`,
          'INVALID_QUANTITY',
        );
      }

      if (item.quantity > 10) {
        throw AppError.badRequest(
          `Quantity limit exceeded for product ${item.productId}`,
          'QUANTITY_LIMIT_EXCEEDED',
        );
      }
    }

    const updatedItems = await this.cartRepository.bulkUpdateCart(userId, data.items);

    this.logger.info(`User ${userId} performed bulk update on ${data.items.length} cart items`);

    return updatedItems;
  }

  /**
   * Bulk remove items from cart
   */
  async bulkRemoveFromCart(userId: string, productIds: string[]): Promise<boolean> {
    const result = await this.cartRepository.bulkRemoveFromCart(userId, productIds);

    if (result) {
      this.logger.info(`User ${userId} bulk removed ${productIds.length} items from cart`);
    }

    return result;
  }

  /**
   * Merge guest cart with user cart
   */
  async mergeGuestCart(
    userId: string,
    data: CartMergeDto,
  ): Promise<{
    mergedItems: CartItem[];
    skippedItems: Array<{ productId: string; reason: string }>;
    summary: CartSummary;
  }> {
    const skippedItems: Array<{ productId: string; reason: string }> = [];

    // Validate and filter guest cart items
    const validItems = [];
    for (const item of data.guestCartItems) {
      try {
        // Basic validation
        if (item.quantity <= 0) {
          skippedItems.push({
            productId: item.productId,
            reason: 'Invalid quantity',
          });
          continue;
        }

        // Check if product exists and is available
        const product = await this.productRepository.findById(item.productId);
        if (!product || product.status !== 'PUBLISHED') {
          skippedItems.push({
            productId: item.productId,
            reason: 'Product not available',
          });
          continue;
        }

        // Check if user is trying to add their own product
        if (product.sellerId === userId) {
          skippedItems.push({
            productId: item.productId,
            reason: 'Cannot buy own product',
          });
          continue;
        }

        validItems.push(item);
      } catch (error) {
        skippedItems.push({
          productId: item.productId,
          reason: 'Validation failed',
        });
      }
    }

    // Merge valid items
    const mergedItems = await this.cartRepository.mergeGuestCart(userId, validItems);
    const summary = await this.getCartSummary(userId);

    this.logger.info(
      `Merged guest cart for user ${userId}: ${mergedItems.length} items merged, ${skippedItems.length} skipped`,
    );

    return {
      mergedItems,
      skippedItems,
      summary,
    };
  }

  /**
   * Get cart analytics
   */
  async getCartAnalytics(userId: string): Promise<CartAnalytics> {
    return await this.cartRepository.getCartAnalytics(userId);
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(userId: string): Promise<number> {
    return await this.cartRepository.getCartItemCount(userId);
  }

  /**
   * Get cart total value
   */
  async getCartValue(userId: string): Promise<number> {
    return await this.cartRepository.getCartTotalValue(userId);
  }

  /**
   * Save item for later
   */
  async saveItemForLater(userId: string, productId: string): Promise<boolean> {
    // Validate cart item exists
    const cartItem = await this.cartRepository.getCartItem(userId, productId);
    Validators.validateExists(cartItem, 'Cart item', productId);

    const result = await this.cartRepository.saveItemForLater(userId, productId);

    if (result) {
      this.logger.info(`User ${userId} saved product ${productId} for later`);
    }

    return result;
  }

  /**
   * Move item from saved to cart
   */
  async moveToCartFromSaved(
    userId: string,
    productId: string,
    quantity: number = 1,
  ): Promise<CartItem> {
    Validators.validatePositiveNumber(quantity, 'Quantity');

    if (quantity > 10) {
      throw AppError.badRequest('Maximum 10 items per product allowed', 'QUANTITY_LIMIT_EXCEEDED');
    }

    const cartItem = await this.cartRepository.moveFromSavedToCart(userId, productId, quantity);

    this.logger.info(`User ${userId} moved product ${productId} from saved to cart`);

    return cartItem;
  }

  /**
   * Get saved items
   */
  async getSavedItems(userId: string): Promise<CartItem[]> {
    return await this.cartRepository.getSavedItems(userId);
  }

  /**
   * Optimize cart (remove out of stock, update prices, etc.)
   */
  async optimizeCart(userId: string): Promise<{
    removedItems: CartItem[];
    updatedItems: CartItem[];
    savings: number;
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    const removedItems: CartItem[] = [];
    const updatedItems: CartItem[] = [];
    let savings = 0;

    // Get current cart validation
    const validation = await this.validateCart(userId);
    const currentItems = await this.getCartItems(userId);

    // Remove items with errors
    for (const error of validation.errors) {
      if (error.type === 'OUT_OF_STOCK' || error.type === 'PRODUCT_UNAVAILABLE') {
        const item = currentItems.find((i) => i.productId === error.productId);
        if (item) {
          await this.removeFromCart(userId, error.productId);
          removedItems.push(item);
          recommendations.push(`Removed ${error.productName} - ${error.message}`);
        }
      }
    }

    // Update prices for items with price changes
    for (const warning of validation.warnings) {
      if (warning.type === 'PRICE_DECREASE') {
        const item = currentItems.find((i) => i.productId === warning.productId);
        if (item && warning.details) {
          const priceDiff = warning.details.oldPrice - warning.details.newPrice;
          savings += priceDiff * item.quantity;
          updatedItems.push(item);
          recommendations.push(
            `Updated price for ${warning.productName} - saved $${(priceDiff * item.quantity).toFixed(2)}`,
          );
        }
      }
    }

    // Sync cart prices
    await this.syncCartPrices(userId);

    this.logger.info(
      `Optimized cart for user ${userId}: removed ${removedItems.length} items, ` +
        `updated ${updatedItems.length} items, saved $${savings.toFixed(2)}`,
    );

    return {
      removedItems,
      updatedItems,
      savings,
      recommendations,
    };
  }

  /**
   * Check for price changes in cart
   */
  async checkPriceChanges(userId: string): Promise<
    Array<{
      productId: string;
      productName: string;
      oldPrice: number;
      newPrice: number;
      changeType: 'increase' | 'decrease';
      changeAmount: number;
      changePercentage: number;
    }>
  > {
    const cartItems = await this.getCartItems(userId);
    const priceChanges = [];

    for (const item of cartItems) {
      const product = item.product!;
      const currentPrice = product.discountPrice || product.price;
      const cartPrice = item.price;

      if (Math.abs(currentPrice - cartPrice) > 0.01) {
        const changeAmount = currentPrice - cartPrice;
        const changePercentage = (changeAmount / cartPrice) * 100;

        priceChanges.push({
          productId: item.productId,
          productName: product.name,
          oldPrice: cartPrice,
          newPrice: currentPrice,
          changeType: changeAmount > 0 ? ('increase' as const) : ('decrease' as const),
          changeAmount: Math.abs(changeAmount),
          changePercentage: Math.abs(changePercentage),
        });
      }
    }

    return priceChanges;
  }

  /**
   * Sync cart prices with current product prices
   */
  async syncCartPrices(userId: string): Promise<{
    updatedItems: number;
    priceChanges: Array<{
      productId: string;
      oldPrice: number;
      newPrice: number;
    }>;
  }> {
    const cartItems = await this.getCartItems(userId);
    const priceChanges = [];
    let updatedItems = 0;

    for (const item of cartItems) {
      const product = item.product!;
      const currentPrice = product.discountPrice || product.price;

      if (Math.abs(currentPrice - item.price) > 0.01) {
        // Update cart item price
        await this.cartRepository.updateCartItem(userId, item.productId, item.quantity);

        priceChanges.push({
          productId: item.productId,
          oldPrice: item.price,
          newPrice: currentPrice,
        });

        updatedItems++;
      }
    }

    if (updatedItems > 0) {
      this.logger.info(`Synced prices for ${updatedItems} cart items for user ${userId}`);
    }

    return {
      updatedItems,
      priceChanges,
    };
  }

  /**
   * Refresh cart data
   */
  async refreshCartData(userId: string): Promise<CartSummary> {
    // Sync prices first
    await this.syncCartPrices(userId);

    // Optimize cart (remove unavailable items)
    await this.optimizeCart(userId);

    // Return fresh summary
    return await this.getCartSummary(userId);
  }

  /**
   * Calculate estimated shipping
   */
  private calculateEstimatedShipping(summary: CartSummary): number {
    // Simple shipping calculation logic
    if (summary.total >= 50) {
      return 0; // Free shipping over $50
    }

    // $5 base shipping + $1 per seller
    return 5 + (summary.groupedBySeller.length - 1) * 1;
  }

  // Placeholder methods for features requiring additional integration
  async generateCartShareLink(userId: string, expirationHours?: number): Promise<string> {
    throw new Error('Method not implemented - requires share service integration');
  }

  async exportCart(userId: string, format: 'json' | 'csv'): Promise<string> {
    throw new Error('Method not implemented - requires export service integration');
  }

  async getCartRecommendations(userId: string): Promise<
    Array<{
      type: 'bundle' | 'similar' | 'frequently_bought_together' | 'price_match';
      products: Array<{ id: string; name: string; price: number; reason: string }>;
      potentialSavings?: number;
    }>
  > {
    throw new Error('Method not implemented - requires recommendation service integration');
  }
}
