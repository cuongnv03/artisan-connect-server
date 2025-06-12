import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { ICartRepository } from './CartRepository.interface';
import {
  CartItem,
  CartSummary,
  CartValidationResult,
  CartValidationError,
  CartValidationWarning,
  SellerCartGroup,
} from '../models/CartItem';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class CartRepository
  extends BasePrismaRepository<CartItem, string>
  implements ICartRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'cartItem');
  }

  async addToCart(
    userId: string,
    productId: string,
    quantity: number,
    variantId?: string,
  ): Promise<CartItem> {
    try {
      // Check if product exists and is available
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          seller: {
            include: {
              artisanProfile: {
                select: { shopName: true, isVerified: true },
              },
            },
          },
          variants: variantId
            ? {
                where: { id: variantId },
              }
            : undefined,
        },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.status !== 'PUBLISHED') {
        throw new AppError('Product is not available for purchase', 400, 'PRODUCT_UNAVAILABLE');
      }

      if (product.sellerId === userId) {
        throw new AppError(
          'You cannot add your own product to cart',
          400,
          'CANNOT_BUY_OWN_PRODUCT',
        );
      }

      let availableQuantity = product.quantity;
      let price = product.discountPrice || product.price;

      // Handle variant-specific logic
      if (variantId) {
        const variant = product.variants?.[0];
        if (!variant) {
          throw new AppError('Product variant not found', 404, 'VARIANT_NOT_FOUND');
        }
        availableQuantity = variant.quantity;
        price = variant.discountPrice || variant.price || price;
      }

      if (availableQuantity < quantity) {
        throw new AppError(
          `Insufficient stock. Only ${availableQuantity} available.`,
          400,
          'INSUFFICIENT_STOCK',
        );
      }

      // Check if item already exists in cart - UPDATED LOGIC
      let existingCartItem;
      if (variantId) {
        // Query with variantId
        existingCartItem = await this.prisma.cartItem.findFirst({
          where: {
            userId,
            productId,
            variantId,
          },
        });
      } else {
        // Query without variantId (variantId is null)
        existingCartItem = await this.prisma.cartItem.findFirst({
          where: {
            userId,
            productId,
            variantId: null,
          },
        });
      }

      let cartItem: any;

      if (existingCartItem) {
        // Update existing item
        const newQuantity = existingCartItem.quantity + quantity;

        if (availableQuantity < newQuantity) {
          throw new AppError(
            `Cannot add ${quantity} more. Total would be ${newQuantity}, but only ${availableQuantity} available.`,
            400,
            'INSUFFICIENT_STOCK',
          );
        }

        cartItem = await this.prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: newQuantity,
            price,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new cart item
        cartItem = await this.prisma.cartItem.create({
          data: {
            userId,
            productId,
            variantId: variantId || null,
            quantity,
            price,
          },
        });
      }

      // Return cart item with product details
      return this.enrichCartItemWithProduct(cartItem, product, variantId);
    } catch (error) {
      this.logger.error(`Error adding to cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add item to cart', 500, 'CART_ADD_ERROR');
    }
  }

  async updateCartItem(
    userId: string,
    productId: string,
    quantity: number,
    variantId?: string,
  ): Promise<CartItem> {
    try {
      if (quantity <= 0) {
        throw new AppError('Quantity must be greater than 0', 400, 'INVALID_QUANTITY');
      }

      // Check product and variant stock
      const whereClause = variantId
        ? { id: productId, variants: { some: { id: variantId } } }
        : { id: productId };

      const product = await this.prisma.product.findFirst({
        where: whereClause,
        include: {
          variants: variantId ? { where: { id: variantId } } : undefined,
        },
      });

      if (!product || product.status !== 'PUBLISHED') {
        throw new AppError('Product is not available', 400, 'PRODUCT_UNAVAILABLE');
      }

      let availableQuantity = product.quantity;
      if (variantId && product.variants?.[0]) {
        availableQuantity = product.variants[0].quantity;
      }

      if (availableQuantity < quantity) {
        throw new AppError(
          `Insufficient stock. Only ${availableQuantity} available.`,
          400,
          'INSUFFICIENT_STOCK',
        );
      }

      // Find cart item - UPDATED LOGIC
      let cartItemWhere;
      if (variantId) {
        cartItemWhere = { userId, productId, variantId };
      } else {
        cartItemWhere = { userId, productId, variantId: null };
      }

      const existingItem = await this.prisma.cartItem.findFirst({
        where: cartItemWhere,
      });

      if (!existingItem) {
        throw new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND');
      }

      const updatedItem = await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity, updatedAt: new Date() },
        include: {
          product: {
            include: {
              seller: {
                include: {
                  artisanProfile: {
                    select: { shopName: true, isVerified: true },
                  },
                },
              },
              variants: variantId ? { where: { id: variantId } } : undefined,
            },
          },
        },
      });

      return this.transformCartItem(updatedItem);
    } catch (error) {
      this.logger.error(`Error updating cart item: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update cart item', 500, 'CART_UPDATE_ERROR');
    }
  }

  async removeFromCart(userId: string, productId: string, variantId?: string): Promise<boolean> {
    try {
      // Find cart item - UPDATED LOGIC
      let cartItemWhere;
      if (variantId) {
        cartItemWhere = { userId, productId, variantId };
      } else {
        cartItemWhere = { userId, productId, variantId: null };
      }

      const existingItem = await this.prisma.cartItem.findFirst({
        where: cartItemWhere,
      });

      if (!existingItem) {
        return false; // Item not found
      }

      await this.prisma.cartItem.delete({
        where: { id: existingItem.id },
      });

      return true;
    } catch (error) {
      this.logger.error(`Error removing from cart: ${error}`);
      throw new AppError('Failed to remove item from cart', 500, 'CART_REMOVE_ERROR');
    }
  }

  async clearCart(userId: string): Promise<boolean> {
    try {
      await this.prisma.cartItem.deleteMany({
        where: { userId },
      });
      return true;
    } catch (error) {
      this.logger.error(`Error clearing cart: ${error}`);
      throw new AppError('Failed to clear cart', 500, 'CART_CLEAR_ERROR');
    }
  }

  async getCartItems(userId: string): Promise<CartItem[]> {
    try {
      const cartItems = await this.prisma.cartItem.findMany({
        where: { userId },
        include: {
          product: {
            include: {
              seller: {
                include: {
                  artisanProfile: {
                    select: { shopName: true, isVerified: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return cartItems.map((item) => this.transformCartItem(item));
    } catch (error) {
      this.logger.error(`Error getting cart items: ${error}`);
      throw new AppError('Failed to get cart items', 500, 'CART_GET_ERROR');
    }
  }

  async getCartSummary(userId: string): Promise<CartSummary> {
    try {
      const cartItems = await this.getCartItems(userId);

      if (cartItems.length === 0) {
        return {
          items: [],
          totalItems: 0,
          totalQuantity: 0,
          subtotal: 0,
          total: 0,
          groupedBySeller: [],
        };
      }

      let subtotal = 0;
      let totalQuantity = 0;

      cartItems.forEach((item) => {
        const price = item.product!.discountPrice || item.product!.price;
        subtotal += price * item.quantity;
        totalQuantity += item.quantity;
      });

      const groupedBySeller = this.groupItemsBySeller(cartItems);

      return {
        items: cartItems,
        totalItems: cartItems.length,
        totalQuantity,
        subtotal,
        total: subtotal,
        groupedBySeller,
      };
    } catch (error) {
      this.logger.error(`Error getting cart summary: ${error}`);
      throw new AppError('Failed to get cart summary', 500, 'CART_SUMMARY_ERROR');
    }
  }

  async validateCartItems(userId: string): Promise<CartValidationResult> {
    try {
      const cartItems = await this.getCartItems(userId);
      const errors: CartValidationError[] = [];
      const warnings: CartValidationWarning[] = [];

      for (const item of cartItems) {
        const product = item.product!;

        // Check if product is still available
        if (product.status !== 'PUBLISHED') {
          errors.push({
            type: 'PRODUCT_UNAVAILABLE',
            productId: item.productId,
            productName: product.name,
            message: 'Product is no longer available',
          });
          continue;
        }

        // Check stock availability
        if (product.quantity < item.quantity) {
          if (product.quantity === 0) {
            errors.push({
              type: 'OUT_OF_STOCK',
              productId: item.productId,
              productName: product.name,
              message: 'Product is out of stock',
            });
          } else {
            errors.push({
              type: 'OUT_OF_STOCK',
              productId: item.productId,
              productName: product.name,
              message: `Only ${product.quantity} available, but ${item.quantity} requested`,
            });
          }
          continue;
        }

        // Check for low stock warning
        if (product.quantity <= item.quantity * 1.5) {
          warnings.push({
            type: 'LOW_STOCK',
            productId: item.productId,
            productName: product.name,
            message: `Low stock: only ${product.quantity} remaining`,
          });
        }

        // Check for price changes
        const currentPrice = product.discountPrice || product.price;
        if (Math.abs(currentPrice - item.price) > 0.01) {
          warnings.push({
            type: 'PRICE_CHANGED',
            productId: item.productId,
            productName: product.name,
            message: `Price changed from $${item.price} to $${currentPrice}`,
          });
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error(`Error validating cart: ${error}`);
      throw new AppError('Failed to validate cart', 500, 'CART_VALIDATION_ERROR');
    }
  }

  async getCartItemCount(userId: string): Promise<number> {
    try {
      const result = await this.prisma.cartItem.aggregate({
        where: { userId },
        _sum: { quantity: true },
      });

      return result._sum.quantity || 0;
    } catch (error) {
      this.logger.error(`Error getting cart item count: ${error}`);
      return 0;
    }
  }

  // Helper methods
  private transformCartItem(cartItem: any): CartItem {
    const baseItem = {
      id: cartItem.id,
      userId: cartItem.userId,
      productId: cartItem.productId,
      variantId: cartItem.variantId,
      quantity: cartItem.quantity,
      price: cartItem.price,
      createdAt: cartItem.createdAt,
      updatedAt: cartItem.updatedAt,
    };

    if (cartItem.product) {
      baseItem.product = {
        id: cartItem.product.id,
        name: cartItem.product.name,
        slug: cartItem.product.slug,
        price: cartItem.product.price,
        discountPrice: cartItem.product.discountPrice,
        images: cartItem.product.images,
        status: cartItem.product.status,
        quantity: cartItem.product.quantity,
        seller: {
          id: cartItem.product.seller.id,
          firstName: cartItem.product.seller.firstName,
          lastName: cartItem.product.seller.lastName,
          username: cartItem.product.seller.username,
          artisanProfile: cartItem.product.seller.artisanProfile,
        },
      };

      // Add variant info if available
      if (cartItem.variantId && cartItem.product.variants?.[0]) {
        const variant = cartItem.product.variants[0];
        baseItem.variant = {
          id: variant.id,
          sku: variant.sku,
          name: variant.name,
          price: variant.price,
          discountPrice: variant.discountPrice,
          images: variant.images,
          attributes: variant.attributes || [],
        };
      }
    }

    return baseItem as CartItem;
  }

  private enrichCartItemWithProduct(cartItem: any, product: any): CartItem {
    return {
      ...cartItem,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        discountPrice: product.discountPrice,
        images: product.images,
        status: product.status,
        quantity: product.quantity,
        seller: {
          id: product.seller.id,
          firstName: product.seller.firstName,
          lastName: product.seller.lastName,
          username: product.seller.username,
          artisanProfile: product.seller.artisanProfile,
        },
      },
    };
  }

  private groupItemsBySeller(cartItems: CartItem[]): SellerCartGroup[] {
    const groups: Record<string, SellerCartGroup> = {};

    cartItems.forEach((item) => {
      const sellerId = item.product!.seller.id;

      if (!groups[sellerId]) {
        groups[sellerId] = {
          sellerId,
          sellerInfo: {
            id: item.product!.seller.id,
            name: `${item.product!.seller.firstName} ${item.product!.seller.lastName}`,
            username: item.product!.seller.username,
            shopName: item.product!.seller.artisanProfile?.shopName,
            isVerified: item.product!.seller.artisanProfile?.isVerified || false,
          },
          items: [],
          subtotal: 0,
          total: 0,
        };
      }

      const group = groups[sellerId];
      group.items.push(item);

      const price = item.product!.discountPrice || item.product!.price;
      group.subtotal += price * item.quantity;
      group.total = group.subtotal;
    });

    return Object.values(groups);
  }
}
