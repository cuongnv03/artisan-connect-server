import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { ICartRepository } from './CartRepository.interface';
import {
  CartItem,
  CartSummary,
  CartValidationResult,
  CartValidationError,
  CartValidationWarning,
  CartAnalytics,
  ProductInCart,
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

  /**
   * Add item to cart
   */
  async addToCart(
    userId: string,
    productId: string,
    quantity: number,
    customizations?: Record<string, any>,
  ): Promise<CartItem> {
    try {
      // Validate product exists and is available
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
          categories: {
            include: {
              category: {
                select: { id: true, name: true, slug: true },
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

      if (product.quantity < quantity) {
        throw new AppError(
          `Insufficient stock. Only ${product.quantity} available.`,
          400,
          'INSUFFICIENT_STOCK',
        );
      }

      // Check if item already exists in cart
      const existingCartItem = await this.prisma.cartItem.findUnique({
        where: {
          userId_productId: { userId, productId },
        },
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

  /**
   * Update cart item
   */
  async updateCartItem(
    userId: string,
    productId: string,
    quantity: number,
    customizations?: Record<string, any>,
  ): Promise<CartItem> {
    try {
      if (quantity <= 0) {
        throw new AppError('Quantity must be greater than 0', 400, 'INVALID_QUANTITY');
      }

      // Validate product stock
      const availability = await this.checkProductAvailability(productId, quantity);
      if (!availability.available) {
        throw new AppError(
          `Insufficient stock. Only ${availability.currentStock} available.`,
          400,
          'INSUFFICIENT_STOCK',
        );
      }

      // Update cart item
      const updatedItem = await this.prisma.cartItem.update({
        where: { userId_productId: { userId, productId } },
        data: {
          quantity,
          updatedAt: new Date(),
        },
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
              categories: {
                include: {
                  category: {
                    select: { id: true, name: true, slug: true },
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

  /**
   * Remove item from cart
   */
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

  /**
   * Clear entire cart
   */
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

  /**
   * Get all cart items for user
   */
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
              categories: {
                include: {
                  category: {
                    select: { id: true, name: true, slug: true },
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

  /**
   * Get single cart item
   */
  async getCartItem(userId: string, productId: string): Promise<CartItem | null> {
    try {
      const cartItem = await this.prisma.cartItem.findUnique({
        where: { userId_productId: { userId, productId } },
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
              categories: {
                include: {
                  category: {
                    select: { id: true, name: true, slug: true },
                  },
                },
              },
            },
          },
        },
      });

      return cartItem ? this.transformCartItem(cartItem) : null;
    } catch (error) {
      this.logger.error(`Error getting cart item: ${error}`);
      return null;
    }
  }

  /**
   * Get cart summary with calculations
   */
  async getCartSummary(userId: string): Promise<CartSummary> {
    try {
      const cartItems = await this.getCartItems(userId);

      if (cartItems.length === 0) {
        return {
          items: [],
          totalItems: 0,
          totalQuantity: 0,
          subtotal: 0,
          totalDiscount: 0,
          total: 0,
          groupedBySeller: [],
        };
      }

      const calculations = await this.calculateCartTotals(cartItems);
      const groupedBySeller = this.groupItemsBySeller(cartItems);

      return {
        items: cartItems,
        totalItems: cartItems.length,
        totalQuantity: calculations.totalQuantity,
        subtotal: calculations.subtotal,
        totalDiscount: calculations.totalDiscount,
        total: calculations.total,
        groupedBySeller,
      };
    } catch (error) {
      this.logger.error(`Error getting cart summary: ${error}`);
      throw new AppError('Failed to get cart summary', 500, 'CART_SUMMARY_ERROR');
    }
  }

  /**
   * Calculate cart totals
   */
  async calculateCartTotals(cartItems: CartItem[]): Promise<{
    subtotal: number;
    totalDiscount: number;
    total: number;
    itemCount: number;
    totalQuantity: number;
  }> {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalQuantity = 0;

    for (const item of cartItems) {
      const product = item.product!;
      const originalPrice = product.price;
      const currentPrice = product.discountPrice || product.price;

      subtotal += originalPrice * item.quantity;
      totalQuantity += item.quantity;

      if (product.discountPrice) {
        totalDiscount += (originalPrice - currentPrice) * item.quantity;
      }
    }

    const total = subtotal - totalDiscount;

    return {
      subtotal,
      totalDiscount,
      total,
      itemCount: cartItems.length,
      totalQuantity,
    };
  }

  /**
   * Validate cart items
   */
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
            currentQuantity: item.quantity,
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
              currentQuantity: item.quantity,
              availableQuantity: product.quantity,
            });
          } else {
            errors.push({
              type: 'OUT_OF_STOCK',
              productId: item.productId,
              productName: product.name,
              message: `Only ${product.quantity} available, but ${item.quantity} requested`,
              currentQuantity: item.quantity,
              availableQuantity: product.quantity,
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
            details: { availableQuantity: product.quantity, requestedQuantity: item.quantity },
          });
        }

        // Check for price changes
        const currentPrice = product.discountPrice || product.price;
        if (Math.abs(currentPrice - item.price) > 0.01) {
          if (currentPrice > item.price) {
            warnings.push({
              type: 'PRICE_INCREASE',
              productId: item.productId,
              productName: product.name,
              message: `Price increased from $${item.price} to $${currentPrice}`,
              details: { oldPrice: item.price, newPrice: currentPrice },
            });
          } else {
            warnings.push({
              type: 'PRICE_DECREASE',
              productId: item.productId,
              productName: product.name,
              message: `Price decreased from $${item.price} to $${currentPrice}`,
              details: { oldPrice: item.price, newPrice: currentPrice },
            });
          }
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

  /**
   * Check product availability
   */
  async checkProductAvailability(
    productId: string,
    requestedQuantity: number,
  ): Promise<{
    available: boolean;
    currentStock: number;
    isActive: boolean;
  }> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { quantity: true, status: true },
      });

      if (!product) {
        return { available: false, currentStock: 0, isActive: false };
      }

      const isActive = product.status === 'PUBLISHED';
      const available = isActive && product.quantity >= requestedQuantity;

      return {
        available,
        currentStock: product.quantity,
        isActive,
      };
    } catch (error) {
      this.logger.error(`Error checking product availability: ${error}`);
      return { available: false, currentStock: 0, isActive: false };
    }
  }

  /**
   * Bulk update cart
   */
  async bulkUpdateCart(
    userId: string,
    updates: Array<{
      productId: string;
      quantity: number;
      customizations?: Record<string, any>;
    }>,
  ): Promise<CartItem[]> {
    try {
      const updatedItems: CartItem[] = [];

      // Use transaction for bulk operations
      await this.prisma.$transaction(async (tx) => {
        for (const update of updates) {
          if (update.quantity <= 0) {
            // Remove item if quantity is 0 or negative
            await tx.cartItem
              .delete({
                where: { userId_productId: { userId, productId: update.productId } },
              })
              .catch(() => {}); // Ignore if item doesn't exist
          } else {
            // Update or create item
            const updatedItem = await tx.cartItem.upsert({
              where: { userId_productId: { userId, productId: update.productId } },
              update: {
                quantity: update.quantity,
                updatedAt: new Date(),
              },
              create: {
                userId,
                productId: update.productId,
                quantity: update.quantity,
                price: 0, // Will be updated with actual price
              },
            });

            // Get product details for the updated item
            const itemWithProduct = await tx.cartItem.findUnique({
              where: { id: updatedItem.id },
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

            if (itemWithProduct) {
              updatedItems.push(this.transformCartItem(itemWithProduct));
            }
          }
        }
      });

      return updatedItems;
    } catch (error) {
      this.logger.error(`Error in bulk update cart: ${error}`);
      throw new AppError('Failed to update cart items', 500, 'CART_BULK_UPDATE_ERROR');
    }
  }

  /**
   * Get cart item count
   */
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

  /**
   * Helper: Transform cart item with product details
   */
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
            isCustomizable: cartItem.product.isCustomizable,
            status: cartItem.product.status,
            quantity: cartItem.product.quantity,
            seller: {
              id: cartItem.product.seller.id,
              firstName: cartItem.product.seller.firstName,
              lastName: cartItem.product.seller.lastName,
              username: cartItem.product.seller.username,
              artisanProfile: cartItem.product.seller.artisanProfile,
            },
            categories: cartItem.product.categories?.map((cp: any) => cp.category) || [],
          }
        : undefined,
    };
  }

  /**
   * Helper: Enrich cart item with product details
   */
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
        isCustomizable: product.isCustomizable,
        status: product.status,
        quantity: product.quantity,
        seller: {
          id: product.seller.id,
          firstName: product.seller.firstName,
          lastName: product.seller.lastName,
          username: product.seller.username,
          artisanProfile: product.seller.artisanProfile,
        },
        categories: product.categories?.map((cp: any) => cp.category) || [],
      },
    };
  }

  /**
   * Helper: Group cart items by seller
   */
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
          itemCount: 0,
          subtotal: 0,
          discount: 0,
          total: 0,
        };
      }

      const group = groups[sellerId];
      group.items.push(item);
      group.itemCount += 1;

      const originalPrice = item.product!.price;
      const currentPrice = item.product!.discountPrice || item.product!.price;

      group.subtotal += originalPrice * item.quantity;
      if (item.product!.discountPrice) {
        group.discount += (originalPrice - currentPrice) * item.quantity;
      }
      group.total = group.subtotal - group.discount;
    });

    return Object.values(groups);
  }

  /**
   * Validate single cart item
   */
  async validateSingleItem(
    userId: string,
    productId: string,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    productInfo?: ProductInCart;
  }> {
    try {
      const cartItem = await this.prisma.cartItem.findUnique({
        where: { userId_productId: { userId, productId } },
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
              categories: {
                include: {
                  category: {
                    select: { id: true, name: true, slug: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!cartItem) {
        return {
          isValid: false,
          errors: ['Item not found in cart'],
        };
      }

      const errors: string[] = [];
      const product = cartItem.product;

      // Check if product exists
      if (!product) {
        errors.push('Product no longer exists');
        return { isValid: false, errors };
      }

      // Check if product is published
      if (product.status !== 'PUBLISHED') {
        errors.push('Product is no longer available for purchase');
      }

      // Check stock availability
      if (product.quantity < cartItem.quantity) {
        if (product.quantity === 0) {
          errors.push('Product is out of stock');
        } else {
          errors.push(`Only ${product.quantity} available, but ${cartItem.quantity} in cart`);
        }
      }

      const productInfo = this.transformCartItem(cartItem).product;

      return {
        isValid: errors.length === 0,
        errors,
        productInfo,
      };
    } catch (error) {
      this.logger.error(`Error validating single item: ${error}`);
      return {
        isValid: false,
        errors: ['Validation failed due to system error'],
      };
    }
  }

  /**
   * Bulk remove items from cart
   */
  async bulkRemoveFromCart(userId: string, productIds: string[]): Promise<boolean> {
    try {
      const result = await this.prisma.cartItem.deleteMany({
        where: {
          userId,
          productId: { in: productIds },
        },
      });

      this.logger.info(`Bulk removed ${result.count} items from cart for user ${userId}`);
      return result.count > 0;
    } catch (error) {
      this.logger.error(`Error in bulk remove from cart: ${error}`);
      throw new AppError('Failed to remove items from cart', 500, 'CART_BULK_REMOVE_ERROR');
    }
  }

  /**
   * Merge guest cart with user cart (for login scenarios)
   */
  async mergeGuestCart(
    userId: string,
    guestCartItems: Array<{
      productId: string;
      quantity: number;
      customizations?: Record<string, any>;
    }>,
  ): Promise<CartItem[]> {
    try {
      const mergedItems: CartItem[] = [];

      await this.prisma.$transaction(async (tx) => {
        for (const guestItem of guestCartItems) {
          try {
            // Check if product exists and is available
            const product = await tx.product.findUnique({
              where: { id: guestItem.productId },
              select: {
                id: true,
                status: true,
                quantity: true,
                price: true,
                discountPrice: true,
              },
            });

            if (!product || product.status !== 'PUBLISHED') {
              this.logger.warn(
                `Skipping unavailable product ${guestItem.productId} during cart merge`,
              );
              continue;
            }

            // Check if item already exists in user's cart
            const existingCartItem = await tx.cartItem.findUnique({
              where: { userId_productId: { userId, productId: guestItem.productId } },
            });

            let finalQuantity = guestItem.quantity;

            if (existingCartItem) {
              // Combine quantities
              finalQuantity = existingCartItem.quantity + guestItem.quantity;
            }

            // Ensure we don't exceed available stock
            if (finalQuantity > product.quantity) {
              finalQuantity = product.quantity;
              this.logger.warn(
                `Reduced quantity for product ${guestItem.productId} to available stock ${product.quantity}`,
              );
            }

            if (finalQuantity > 0) {
              // Upsert cart item
              const cartItem = await tx.cartItem.upsert({
                where: { userId_productId: { userId, productId: guestItem.productId } },
                update: {
                  quantity: finalQuantity,
                  price: product.discountPrice || product.price,
                  updatedAt: new Date(),
                },
                create: {
                  userId,
                  productId: guestItem.productId,
                  quantity: finalQuantity,
                  price: product.discountPrice || product.price,
                },
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
                      categories: {
                        include: {
                          category: {
                            select: { id: true, name: true, slug: true },
                          },
                        },
                      },
                    },
                  },
                },
              });

              mergedItems.push(this.transformCartItem(cartItem));
            }
          } catch (itemError) {
            this.logger.error(`Error merging item ${guestItem.productId}: ${itemError}`);
            // Continue with other items
          }
        }
      });

      this.logger.info(`Merged ${mergedItems.length} items from guest cart for user ${userId}`);
      return mergedItems;
    } catch (error) {
      this.logger.error(`Error merging guest cart: ${error}`);
      throw new AppError('Failed to merge guest cart', 500, 'CART_MERGE_ERROR');
    }
  }

  /**
   * Get cart analytics for user
   */
  async getCartAnalytics(userId: string): Promise<CartAnalytics> {
    try {
      const cartItems = await this.getCartItems(userId);

      if (cartItems.length === 0) {
        return {
          totalValue: 0,
          averageItemPrice: 0,
          mostExpensiveItem: {} as CartItem,
          itemsByCategory: {},
          sellerDistribution: {},
          addedToCartDates: [],
        };
      }

      let totalValue = 0;
      let totalPrice = 0;
      let mostExpensiveItem = cartItems[0];
      const itemsByCategory: Record<string, number> = {};
      const sellerDistribution: Record<string, number> = {};
      const addedToCartDates: Date[] = [];

      cartItems.forEach((item) => {
        const itemPrice = (item.product!.discountPrice || item.product!.price) * item.quantity;
        totalValue += itemPrice;
        totalPrice += item.product!.discountPrice || item.product!.price;

        // Find most expensive item
        const currentItemPrice = item.product!.discountPrice || item.product!.price;
        const mostExpensivePrice =
          mostExpensiveItem.product!.discountPrice || mostExpensiveItem.product!.price;
        if (currentItemPrice > mostExpensivePrice) {
          mostExpensiveItem = item;
        }

        // Count items by category
        item.product!.categories?.forEach((category) => {
          itemsByCategory[category.name] = (itemsByCategory[category.name] || 0) + 1;
        });

        // Count items by seller
        const sellerName =
          item.product!.seller.artisanProfile?.shopName ||
          `${item.product!.seller.firstName} ${item.product!.seller.lastName}`;
        sellerDistribution[sellerName] = (sellerDistribution[sellerName] || 0) + item.quantity;

        // Track when items were added
        addedToCartDates.push(item.createdAt);
      });

      return {
        totalValue,
        averageItemPrice: totalPrice / cartItems.length,
        mostExpensiveItem,
        itemsByCategory,
        sellerDistribution,
        addedToCartDates,
      };
    } catch (error) {
      this.logger.error(`Error getting cart analytics: ${error}`);
      throw new AppError('Failed to get cart analytics', 500, 'CART_ANALYTICS_ERROR');
    }
  }

  /**
   * Get total cart value
   */
  async getCartTotalValue(userId: string): Promise<number> {
    try {
      const cartItems = await this.prisma.cartItem.findMany({
        where: { userId },
        include: {
          product: {
            select: { price: true, discountPrice: true },
          },
        },
      });

      return cartItems.reduce((total, item) => {
        const price = item.product?.discountPrice || item.product?.price || 0;
        return total + price * item.quantity;
      }, 0);
    } catch (error) {
      this.logger.error(`Error getting cart total value: ${error}`);
      return 0;
    }
  }

  /**
   * Get out of stock items in cart
   */
  async getOutOfStockItems(userId: string): Promise<CartItem[]> {
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
              categories: {
                include: {
                  category: {
                    select: { id: true, name: true, slug: true },
                  },
                },
              },
            },
          },
        },
      });

      const outOfStockItems = cartItems.filter((item) => {
        const product = item.product;
        return !product || product.status !== 'PUBLISHED' || product.quantity < item.quantity;
      });

      return outOfStockItems.map((item) => this.transformCartItem(item));
    } catch (error) {
      this.logger.error(`Error getting out of stock items: ${error}`);
      throw new AppError('Failed to get out of stock items', 500, 'CART_OUT_OF_STOCK_ERROR');
    }
  }

  /**
   * Get recently removed items (implementation would require tracking removals)
   */
  async getRecentlyRemovedItems(userId: string, days: number = 7): Promise<CartItem[]> {
    try {
      // This would require a separate table to track removed items
      // For now, return empty array as this feature would need additional schema
      this.logger.info(`Recently removed items requested for user ${userId} (${days} days)`);
      return [];
    } catch (error) {
      this.logger.error(`Error getting recently removed items: ${error}`);
      return [];
    }
  }

  /**
   * Cleanup expired carts
   */
  async cleanupExpiredCarts(olderThanDays: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.prisma.cartItem.deleteMany({
        where: {
          updatedAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.info(
        `Cleaned up ${result.count} expired cart items older than ${olderThanDays} days`,
      );
      return result.count;
    } catch (error) {
      this.logger.error(`Error cleaning up expired carts: ${error}`);
      throw new AppError('Failed to cleanup expired carts', 500, 'CART_CLEANUP_ERROR');
    }
  }

  /**
   * Get all carts containing a specific product
   */
  async getCartsByProduct(productId: string): Promise<{ userId: string; quantity: number }[]> {
    try {
      const cartItems = await this.prisma.cartItem.findMany({
        where: { productId },
        select: { userId: true, quantity: true },
      });

      return cartItems;
    } catch (error) {
      this.logger.error(`Error getting carts by product: ${error}`);
      throw new AppError('Failed to get carts by product', 500, 'CART_BY_PRODUCT_ERROR');
    }
  }

  /**
   * Get popular cart items across all users
   */
  async getPopularCartItems(limit: number = 10): Promise<
    Array<{
      productId: string;
      productName: string;
      totalQuantity: number;
      uniqueUsers: number;
    }>
  > {
    try {
      const popularItems = await this.prisma.cartItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        _count: { userId: true },
        orderBy: {
          _sum: { quantity: 'desc' },
        },
        take: limit,
      });

      const itemsWithDetails = await Promise.all(
        popularItems.map(async (item) => {
          const product = await this.prisma.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });

          return {
            productId: item.productId,
            productName: product?.name || 'Unknown Product',
            totalQuantity: item._sum.quantity || 0,
            uniqueUsers: item._count.userId,
          };
        }),
      );

      return itemsWithDetails;
    } catch (error) {
      this.logger.error(`Error getting popular cart items: ${error}`);
      throw new AppError('Failed to get popular cart items', 500, 'CART_POPULAR_ERROR');
    }
  }

  /**
   * Save item for later (move to wishlist-like state)
   */
  async saveItemForLater(userId: string, productId: string): Promise<boolean> {
    try {
      // This could be implemented by adding a status field to cart items
      // or moving to a separate saved_items table
      // For now, we'll add the item to user's wishlist if it exists

      const cartItem = await this.prisma.cartItem.findUnique({
        where: { userId_productId: { userId, productId } },
      });

      if (!cartItem) {
        return false;
      }

      // Create wishlist entry
      await this.prisma.wishlist.upsert({
        where: { userId_productId: { userId, productId } },
        update: {},
        create: { userId, productId },
      });

      // Remove from cart
      await this.prisma.cartItem.delete({
        where: { userId_productId: { userId, productId } },
      });

      this.logger.info(`Saved item ${productId} for later for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error saving item for later: ${error}`);
      throw new AppError('Failed to save item for later', 500, 'CART_SAVE_LATER_ERROR');
    }
  }

  /**
   * Move item from saved/wishlist back to cart
   */
  async moveFromSavedToCart(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartItem> {
    try {
      // Check if item is in wishlist
      const wishlistItem = await this.prisma.wishlist.findUnique({
        where: { userId_productId: { userId, productId } },
      });

      if (!wishlistItem) {
        throw new AppError('Item not found in saved items', 404, 'ITEM_NOT_SAVED');
      }

      // Add to cart
      const cartItem = await this.addToCart(userId, productId, quantity);

      // Remove from wishlist
      await this.prisma.wishlist.delete({
        where: { userId_productId: { userId, productId } },
      });

      this.logger.info(`Moved item ${productId} from saved to cart for user ${userId}`);
      return cartItem;
    } catch (error) {
      this.logger.error(`Error moving from saved to cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to move item to cart', 500, 'CART_MOVE_FROM_SAVED_ERROR');
    }
  }

  /**
   * Get saved items (from wishlist)
   */
  async getSavedItems(userId: string): Promise<CartItem[]> {
    try {
      const savedItems = await this.prisma.wishlist.findMany({
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
              categories: {
                include: {
                  category: {
                    select: { id: true, name: true, slug: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform wishlist items to cart item format
      return savedItems.map((item) => ({
        id: item.id,
        userId: item.userId,
        productId: item.productId,
        quantity: 1, // Default quantity for saved items
        price: item.product.discountPrice || item.product.price,
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          discountPrice: item.product.discountPrice,
          images: item.product.images,
          isCustomizable: item.product.isCustomizable,
          status: item.product.status,
          quantity: item.product.quantity,
          seller: {
            id: item.product.seller.id,
            firstName: item.product.seller.firstName,
            lastName: item.product.seller.lastName,
            username: item.product.seller.username,
            artisanProfile: item.product.seller.artisanProfile,
          },
          categories: item.product.categories?.map((cp: any) => cp.category) || [],
        },
      }));
    } catch (error) {
      this.logger.error(`Error getting saved items: ${error}`);
      throw new AppError('Failed to get saved items', 500, 'CART_GET_SAVED_ERROR');
    }
  }
}
