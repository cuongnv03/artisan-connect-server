import { PrismaClient, Category as PrismaCategory, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { ICartRepository } from '../domain/repositories/CartRepository.interface';
import { CartItem, CartWithTotals } from '../domain/entities/CartItem';
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

  /**
   * Add item to cart
   */
  async addToCart(userId: string, productId: string, quantity: number): Promise<CartItem> {
    try {
      // Check if product exists and is in stock
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          price: true,
          discountPrice: true,
          quantity: true,
          status: true,
          isCustomizable: true,
          sellerId: true,
        },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.status !== 'PUBLISHED') {
        throw new AppError('Product is not available for purchase', 400, 'PRODUCT_UNAVAILABLE');
      }

      if (product.quantity < quantity) {
        throw new AppError(
          `Not enough stock. Only ${product.quantity} available.`,
          400,
          'INSUFFICIENT_STOCK',
        );
      }

      // Check if item is already in cart
      const existingCartItem = await this.prisma.cartItem.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      let cartItem;

      if (existingCartItem) {
        // Update quantity if already in cart
        const newQuantity = existingCartItem.quantity + quantity;

        // Recheck stock with total quantity
        if (product.quantity < newQuantity) {
          throw new AppError(
            `Cannot add ${quantity} more units. Only ${product.quantity} available in stock.`,
            400,
            'INSUFFICIENT_STOCK',
          );
        }

        cartItem = await this.prisma.cartItem.update({
          where: {
            userId_productId: {
              userId,
              productId,
            },
          },
          data: {
            quantity: newQuantity,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                discountPrice: true,
                images: true,
                quantity: true,
                isCustomizable: true,
                seller: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    artisanProfile: {
                      select: {
                        shopName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
      } else {
        // Add new item to cart
        cartItem = await this.prisma.cartItem.create({
          data: {
            userId,
            productId,
            quantity,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                discountPrice: true,
                images: true,
                quantity: true,
                isCustomizable: true,
                seller: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    artisanProfile: {
                      select: {
                        shopName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
      }

      // Transform the product data
      const transformedCartItem = {
        ...cartItem,
        product: {
          ...cartItem.product,
          stock: cartItem.product.quantity, // Add stock info
        },
      };

      delete transformedCartItem.product.quantity; // Remove the original quantity field

      return transformedCartItem as unknown as CartItem;
    } catch (error) {
      this.logger.error(`Error adding to cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add item to cart', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get cart items for a user
   */
  async getCartItems(userId: string): Promise<CartItem[]> {
    try {
      const cartItems = await this.prisma.cartItem.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              discountPrice: true,
              images: true,
              quantity: true,
              isCustomizable: true,
              seller: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  artisanProfile: {
                    select: {
                      shopName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transform items to include stock information
      return cartItems.map((item) => {
        const transformedItem = {
          ...item,
          product: {
            ...item.product,
            stock: item.product.quantity,
          },
        };

        delete transformedItem.product.quantity;
        return transformedItem;
      }) as unknown as CartItem[];
    } catch (error) {
      this.logger.error(`Error getting cart items: ${error}`);
      throw new AppError('Failed to get cart items', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get cart with calculated totals
   */
  async getCartWithTotals(userId: string): Promise<CartWithTotals> {
    try {
      const cartItems = await this.getCartItems(userId);

      // Calculate totals
      let subtotal = 0;
      let discount = 0;

      // Group items by seller
      const groupedBySeller: {
        [sellerId: string]: {
          seller: {
            id: string;
            name: string;
            shopName?: string;
          };
          items: CartItem[];
          subtotal: number;
        };
      } = {};

      cartItems.forEach((item) => {
        const price = item.product?.price || 0;
        const discountPrice = item.product?.discountPrice;
        const sellerId = item.product?.seller?.id;

        // Calculate item price
        let itemTotal = 0;
        if (discountPrice) {
          itemTotal = discountPrice * item.quantity;
          subtotal += price * item.quantity;
          discount += (price - discountPrice) * item.quantity;
        } else {
          itemTotal = price * item.quantity;
          subtotal += itemTotal;
        }

        // Group by seller
        if (sellerId) {
          if (!groupedBySeller[sellerId]) {
            groupedBySeller[sellerId] = {
              seller: {
                id: sellerId,
                name: `${item.product?.seller?.firstName} ${item.product?.seller?.lastName}`,
                shopName: item.product?.seller?.artisanProfile?.shopName,
              },
              items: [],
              subtotal: 0,
            };
          }

          groupedBySeller[sellerId].items.push(item);
          groupedBySeller[sellerId].subtotal += itemTotal;
        }
      });

      const total = subtotal - discount;

      return {
        items: cartItems,
        totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        discount,
        total,
        groupedBySeller,
      };
    } catch (error) {
      this.logger.error(`Error getting cart with totals: ${error}`);
      throw new AppError('Failed to get cart with totals', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartItem> {
    try {
      // Verify product has enough stock
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          quantity: true,
          status: true,
        },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      if (product.status !== 'PUBLISHED') {
        throw new AppError('Product is no longer available', 400, 'PRODUCT_UNAVAILABLE');
      }

      if (quantity > product.quantity) {
        throw new AppError(
          `Not enough stock. Only ${product.quantity} available.`,
          400,
          'INSUFFICIENT_STOCK',
        );
      }

      // If quantity is 0, remove from cart
      if (quantity <= 0) {
        await this.removeFromCart(userId, productId);
        throw new AppError('Item removed from cart', 200, 'ITEM_REMOVED');
      }

      // Update cart item
      const updatedItem = await this.prisma.cartItem.update({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        data: {
          quantity,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              discountPrice: true,
              images: true,
              quantity: true,
              isCustomizable: true,
              seller: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  artisanProfile: {
                    select: {
                      shopName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Transform to add stock information
      const transformedItem = {
        ...updatedItem,
        product: {
          ...updatedItem.product,
          stock: updatedItem.product.quantity,
        },
      };

      delete transformedItem.product.quantity;

      return transformedItem as unknown as CartItem;
    } catch (error) {
      this.logger.error(`Error updating cart item quantity: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update cart item', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId: string, productId: string): Promise<boolean> {
    try {
      const result = await this.prisma.cartItem.delete({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      return !!result;
    } catch (error) {
      this.logger.error(`Error removing item from cart: ${error}`);
      // If item not found, just return false
      if ((error as any).code === 'P2025') {
        return false;
      }
      throw new AppError('Failed to remove item from cart', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string): Promise<boolean> {
    try {
      await this.prisma.cartItem.deleteMany({
        where: { userId },
      });

      return true;
    } catch (error) {
      this.logger.error(`Error clearing cart: ${error}`);
      throw new AppError('Failed to clear cart', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Check if product is in cart
   */
  async isProductInCart(userId: string, productId: string): Promise<boolean> {
    try {
      const cartItem = await this.prisma.cartItem.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      return !!cartItem;
    } catch (error) {
      this.logger.error(`Error checking if product is in cart: ${error}`);
      return false;
    }
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(userId: string): Promise<number> {
    try {
      const result = await this.prisma.cartItem.aggregate({
        where: { userId },
        _sum: {
          quantity: true,
        },
      });

      return result._sum.quantity || 0;
    } catch (error) {
      this.logger.error(`Error getting cart item count: ${error}`);
      return 0;
    }
  }

  /**
   * Validate cart items against inventory
   */
  async validateCartItems(userId: string): Promise<{ valid: boolean; invalidItems?: CartItem[] }> {
    try {
      const cartItems = await this.getCartItems(userId);
      const invalidItems: CartItem[] = [];

      for (const item of cartItems) {
        // Get current product
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            quantity: true,
            status: true,
          },
        });

        // Check if product exists, is published, and has enough stock
        if (!product || product.status !== 'PUBLISHED' || product.quantity < item.quantity) {
          invalidItems.push(item);
        }
      }

      return {
        valid: invalidItems.length === 0,
        invalidItems: invalidItems.length > 0 ? invalidItems : undefined,
      };
    } catch (error) {
      this.logger.error(`Error validating cart items: ${error}`);
      throw new AppError('Failed to validate cart items', 500, 'DATABASE_ERROR');
    }
  }
}
