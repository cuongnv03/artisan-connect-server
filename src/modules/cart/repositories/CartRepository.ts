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

  async addToCart(userId: string, productId: string, quantity: number): Promise<CartItem> {
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

      if (product.quantity < quantity) {
        throw new AppError(
          `Insufficient stock. Only ${product.quantity} available.`,
          400,
          'INSUFFICIENT_STOCK',
        );
      }

      // Check if item already exists in cart
      const existingCartItem = await this.prisma.cartItem.findUnique({
        where: { userId_productId: { userId, productId } },
      });

      let cartItem: any;

      if (existingCartItem) {
        // Update existing item
        const newQuantity = existingCartItem.quantity + quantity;

        if (product.quantity < newQuantity) {
          throw new AppError(
            `Cannot add ${quantity} more. Total would be ${newQuantity}, but only ${product.quantity} available.`,
            400,
            'INSUFFICIENT_STOCK',
          );
        }

        cartItem = await this.prisma.cartItem.update({
          where: { userId_productId: { userId, productId } },
          data: {
            quantity: newQuantity,
            price: product.discountPrice || product.price,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new cart item
        cartItem = await this.prisma.cartItem.create({
          data: {
            userId,
            productId,
            quantity,
            price: product.discountPrice || product.price,
          },
        });
      }

      // Return cart item with product details
      return this.enrichCartItemWithProduct(cartItem, product);
    } catch (error) {
      this.logger.error(`Error adding to cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add item to cart', 500, 'CART_ADD_ERROR');
    }
  }

  async updateCartItem(userId: string, productId: string, quantity: number): Promise<CartItem> {
    try {
      if (quantity <= 0) {
        throw new AppError('Quantity must be greater than 0', 400, 'INVALID_QUANTITY');
      }

      // Check product stock
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { quantity: true, status: true },
      });

      if (!product || product.status !== 'PUBLISHED') {
        throw new AppError('Product is not available', 400, 'PRODUCT_UNAVAILABLE');
      }

      if (product.quantity < quantity) {
        throw new AppError(
          `Insufficient stock. Only ${product.quantity} available.`,
          400,
          'INSUFFICIENT_STOCK',
        );
      }

      const updatedItem = await this.prisma.cartItem.update({
        where: { userId_productId: { userId, productId } },
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

  async removeFromCart(userId: string, productId: string): Promise<boolean> {
    try {
      await this.prisma.cartItem.delete({
        where: { userId_productId: { userId, productId } },
      });
      return true;
    } catch (error) {
      this.logger.error(`Error removing from cart: ${error}`);
      if ((error as any).code === 'P2025') {
        return false; // Item not found
      }
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
    return {
      id: cartItem.id,
      userId: cartItem.userId,
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      price: cartItem.price,
      createdAt: cartItem.createdAt,
      updatedAt: cartItem.updatedAt,
      product: cartItem.product
        ? {
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
          }
        : undefined,
    };
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
