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
import { Decimal } from '@prisma/client/runtime/library';

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
        where: { id: productId, deletedAt: null },
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
                where: { id: variantId, isActive: true },
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

      // Check if item already exists in cart - Handle unique constraint properly
      const existingCartItem = await this.prisma.cartItem.findUnique({
        where: {
          userId_productId_variantId: {
            userId,
            productId,
            variantId: variantId || null,
          },
        },
      });

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
            price: new Decimal(price.toString()),
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
            price: new Decimal(price.toString()),
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
      const product = await this.prisma.product.findUnique({
        where: { id: productId, deletedAt: null },
        include: {
          variants: variantId ? { where: { id: variantId, isActive: true } } : undefined,
          seller: {
            include: {
              artisanProfile: {
                select: { shopName: true, isVerified: true },
              },
            },
          },
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

      // Find cart item using unique constraint
      const existingItem = await this.prisma.cartItem.findUnique({
        where: {
          userId_productId_variantId: {
            userId,
            productId,
            variantId: variantId || null,
          },
        },
      });

      if (!existingItem) {
        throw new AppError('Cart item not found', 404, 'CART_ITEM_NOT_FOUND');
      }

      const updatedItem = await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity, updatedAt: new Date() },
      });

      return this.enrichCartItemWithProduct(updatedItem, product, variantId);
    } catch (error) {
      this.logger.error(`Error updating cart item: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update cart item', 500, 'CART_UPDATE_ERROR');
    }
  }

  async removeFromCart(userId: string, productId: string, variantId?: string): Promise<boolean> {
    try {
      const existingItem = await this.prisma.cartItem.findUnique({
        where: {
          userId_productId_variantId: {
            userId,
            productId,
            variantId: variantId || null,
          },
        },
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
          variant: true,
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
        const currentPrice =
          item.variant?.discountPrice ||
          item.variant?.price ||
          item.product!.discountPrice ||
          item.product!.price;
        const price = Number(currentPrice);
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

        // Determine available quantity and current price
        let availableQuantity = product.quantity;
        let currentPrice = product.discountPrice || product.price;

        if (item.variantId && item.variant) {
          availableQuantity = item.variant.quantity;
          currentPrice = item.variant.discountPrice || item.variant.price || currentPrice;
        }

        // Check stock availability
        if (availableQuantity < item.quantity) {
          if (availableQuantity === 0) {
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
              message: `Only ${availableQuantity} available, but ${item.quantity} requested`,
            });
          }
          continue;
        }

        // Check for low stock warning
        if (availableQuantity <= item.quantity * 1.5) {
          warnings.push({
            type: 'LOW_STOCK',
            productId: item.productId,
            productName: product.name,
            message: `Low stock: only ${availableQuantity} remaining`,
          });
        }

        // Check for price changes
        const itemPrice = Number(item.price);
        const actualPrice = Number(currentPrice);
        if (Math.abs(actualPrice - itemPrice) > 0.01) {
          warnings.push({
            type: 'PRICE_CHANGED',
            productId: item.productId,
            productName: product.name,
            message: `Price changed from $${itemPrice.toFixed(2)} to $${actualPrice.toFixed(2)}`,
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
    const baseItem: CartItem = {
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
    }

    if (cartItem.variant) {
      baseItem.variant = {
        id: cartItem.variant.id,
        sku: cartItem.variant.sku,
        name: cartItem.variant.name,
        price: cartItem.variant.price,
        discountPrice: cartItem.variant.discountPrice,
        images: cartItem.variant.images,
        attributes: this.parseVariantAttributes(cartItem.variant.attributes),
      };
    }

    return baseItem;
  }

  private enrichCartItemWithProduct(cartItem: any, product: any, variantId?: string): CartItem {
    const transformedItem: CartItem = {
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

    if (variantId && product.variants?.[0]) {
      const variant = product.variants[0];
      transformedItem.variant = {
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        discountPrice: variant.discountPrice,
        images: variant.images,
        attributes: this.parseVariantAttributes(variant.attributes),
      };
    }

    return transformedItem;
  }

  private parseVariantAttributes(
    attributes: any,
  ): Array<{ key: string; name: string; value: string }> {
    if (!attributes || typeof attributes !== 'object') {
      return [];
    }

    return Object.entries(attributes).map(([key, value]) => ({
      key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: String(value),
    }));
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

      const currentPrice =
        item.variant?.discountPrice ||
        item.variant?.price ||
        item.product!.discountPrice ||
        item.product!.price;
      const price = Number(currentPrice);
      group.subtotal += price * item.quantity;
      group.total = group.subtotal;
    });

    return Object.values(groups);
  }
}
