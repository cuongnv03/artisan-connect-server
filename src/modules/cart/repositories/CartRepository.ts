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
  NegotiationValidationError,
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

  /**
   * Helper method to find cart item handling null variantId properly
   */
  private async findCartItem(userId: string, productId: string, variantId?: string | null) {
    if (variantId) {
      // When variantId is provided, use the unique constraint
      return await this.prisma.cartItem.findUnique({
        where: {
          userId_productId_variantId: {
            userId,
            productId,
            variantId,
          },
        },
      });
    } else {
      // When variantId is null, use findFirst with explicit null check
      return await this.prisma.cartItem.findFirst({
        where: {
          userId,
          productId,
          variantId: null,
        },
      });
    }
  }

  /**
   * Helper method to find all cart items for a user with optional filters
   */
  private async findCartItems(
    userId: string,
    filters?: {
      productId?: string;
      variantId?: string | null;
    },
  ) {
    const where: any = { userId };

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    if (filters?.variantId !== undefined) {
      where.variantId = filters.variantId;
    }

    return await this.prisma.cartItem.findMany({
      where,
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
        negotiation: {
          select: {
            id: true,
            originalPrice: true,
            finalPrice: true,
            status: true,
            expiresAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addToCart(
    userId: string,
    productId: string,
    quantity: number,
    variantId?: string,
    negotiationId?: string,
  ): Promise<CartItem> {
    try {
      // Validate product và negotiation
      const { product, finalPrice, validatedNegotiation } =
        await this.validateProductAndNegotiation(
          productId,
          userId,
          quantity,
          variantId,
          negotiationId,
        );

      // Check existing cart item using helper method
      const existingCartItem = await this.findCartItem(userId, productId, variantId);

      let cartItem: any;

      if (existingCartItem) {
        // Cập nhật existing item - handle negotiation conflicts
        if (
          existingCartItem.negotiationId &&
          negotiationId &&
          existingCartItem.negotiationId !== negotiationId
        ) {
          throw new AppError(
            'This product already exists in cart with different negotiated price. Remove it first.',
            400,
            'NEGOTIATION_CONFLICT',
          );
        }

        const newQuantity = existingCartItem.quantity + quantity;

        // Validate quantity với negotiation nếu có
        if (validatedNegotiation && newQuantity > validatedNegotiation.quantity) {
          throw new AppError(
            `Cannot add ${quantity} more. Negotiated quantity is only ${validatedNegotiation.quantity}.`,
            400,
            'EXCEEDS_NEGOTIATED_QUANTITY',
          );
        }

        cartItem = await this.prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: newQuantity,
            price: new Decimal(finalPrice.toString()),
            negotiationId: negotiationId || existingCartItem.negotiationId,
            updatedAt: new Date(),
          },
        });
      } else {
        // ✅ Tạo cart item mới
        cartItem = await this.prisma.cartItem.create({
          data: {
            userId,
            productId,
            variantId: variantId || null, // Explicitly set to null if undefined
            quantity,
            price: new Decimal(finalPrice.toString()),
            negotiationId,
          },
        });
      }

      return this.enrichCartItemWithProduct(cartItem, product, variantId, validatedNegotiation);
    } catch (error) {
      this.logger.error(`Error adding to cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add item to cart', 500, 'CART_ADD_ERROR');
    }
  }

  async addNegotiatedItemToCart(
    userId: string,
    negotiationId: string,
    quantity?: number,
  ): Promise<CartItem> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Get negotiation with full details
        const negotiation = await tx.priceNegotiation.findUnique({
          where: { id: negotiationId },
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
                variants: negotiation.variantId
                  ? { where: { id: negotiation.variantId, isActive: true } }
                  : undefined,
              },
            },
            variant: negotiation.variantId
              ? {
                  select: {
                    id: true,
                    sku: true,
                    name: true,
                    price: true,
                    discountPrice: true,
                    quantity: true,
                    images: true,
                    attributes: true,
                    isActive: true,
                  },
                }
              : undefined,
          },
        });

        if (!negotiation) {
          throw new AppError('Price negotiation not found', 404, 'NEGOTIATION_NOT_FOUND');
        }

        // 2. Validate negotiation
        if (negotiation.customerId !== userId) {
          throw new AppError(
            'You can only use your own negotiations',
            403,
            'NEGOTIATION_NOT_YOURS',
          );
        }

        if (negotiation.status !== 'ACCEPTED') {
          throw new AppError(
            'Only accepted negotiations can be used',
            400,
            'NEGOTIATION_NOT_ACCEPTED',
          );
        }

        if (negotiation.expiresAt && negotiation.expiresAt < new Date()) {
          throw new AppError('This price negotiation has expired', 400, 'NEGOTIATION_EXPIRED');
        }

        if (!negotiation.finalPrice) {
          throw new AppError('Negotiation does not have a final price', 400, 'NO_FINAL_PRICE');
        }

        // 3. Validate product
        const product = negotiation.product;
        if (product.status !== 'PUBLISHED') {
          throw new AppError('Product is not available', 400, 'PRODUCT_UNAVAILABLE');
        }

        // 4. Determine quantity and validate stock
        const finalQuantity = quantity || negotiation.quantity;
        let availableQuantity = product.quantity;

        if (negotiation.variantId && negotiation.variant) {
          if (!negotiation.variant.isActive) {
            throw new AppError('Product variant is not active', 400, 'VARIANT_INACTIVE');
          }
          availableQuantity = negotiation.variant.quantity;
        }

        if (finalQuantity > negotiation.quantity) {
          throw new AppError(
            `Requested quantity (${finalQuantity}) exceeds negotiated quantity (${negotiation.quantity})`,
            400,
            'EXCEEDS_NEGOTIATED_QUANTITY',
          );
        }

        if (finalQuantity > availableQuantity) {
          throw new AppError(
            `Insufficient stock. Only ${availableQuantity} available.`,
            400,
            'INSUFFICIENT_STOCK',
          );
        }

        // 5. Check existing cart item với same negotiation
        const existingCartItem = await this.findCartItem(
          userId,
          negotiation.productId,
          negotiation.variantId,
        );

        if (existingCartItem && existingCartItem.negotiationId === negotiationId) {
          // Update existing cart item
          const newQuantity = existingCartItem.quantity + finalQuantity;

          if (newQuantity > negotiation.quantity) {
            throw new AppError(
              `Total quantity (${newQuantity}) would exceed negotiated quantity (${negotiation.quantity})`,
              400,
              'EXCEEDS_NEGOTIATED_QUANTITY',
            );
          }

          const updatedItem = await tx.cartItem.update({
            where: { id: existingCartItem.id },
            data: {
              quantity: newQuantity,
              updatedAt: new Date(),
            },
          });

          return this.enrichCartItemWithProduct(
            updatedItem,
            product,
            negotiation.variantId,
            negotiation,
          );
        }

        // 6. Create new cart item with negotiated price
        const cartItem = await tx.cartItem.create({
          data: {
            userId,
            productId: negotiation.productId,
            variantId: negotiation.variantId || null,
            quantity: finalQuantity,
            price: new Decimal(negotiation.finalPrice.toString()),
            negotiationId,
          },
        });

        this.logger.info(
          `Added negotiated item to cart: user ${userId}, negotiation ${negotiationId}, quantity ${finalQuantity}`,
        );

        return this.enrichCartItemWithProduct(
          cartItem,
          product,
          negotiation.variantId,
          negotiation,
        );
      });
    } catch (error) {
      this.logger.error(`Error adding negotiated item to cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add negotiated item to cart', 500, 'CART_ADD_ERROR');
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

      // Find cart item using helper method
      const existingItem = await this.findCartItem(userId, productId, variantId);

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
      // Find cart item using helper method
      const existingItem = await this.findCartItem(userId, productId, variantId);

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
      const cartItems = await this.findCartItems(userId);
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
          hasNegotiatedItems: false,
        };
      }

      let subtotal = 0;
      let totalQuantity = 0;
      let hasNegotiatedItems = false;

      cartItems.forEach((item) => {
        const price = Number(item.price);
        subtotal += price * item.quantity;
        totalQuantity += item.quantity;

        if (item.negotiationId) {
          hasNegotiatedItems = true;
        }
      });

      const groupedBySeller = this.groupItemsBySeller(cartItems);

      return {
        items: cartItems,
        totalItems: cartItems.length,
        totalQuantity,
        subtotal,
        total: subtotal,
        groupedBySeller,
        hasNegotiatedItems,
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
      const negotiationIssues: NegotiationValidationError[] = [];

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

        if (item.negotiationId && item.negotiation) {
          const negotiation = item.negotiation;

          if (negotiation.status !== 'ACCEPTED') {
            negotiationIssues.push({
              type: 'NEGOTIATION_INVALID',
              negotiationId: item.negotiationId,
              productName: product.name,
              message: 'Price negotiation is no longer valid',
            });
          }

          if (negotiation.expiresAt && negotiation.expiresAt < new Date()) {
            negotiationIssues.push({
              type: 'NEGOTIATION_EXPIRED',
              negotiationId: item.negotiationId,
              productName: product.name,
              message: 'Price negotiation has expired',
            });
          }
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
        negotiationIssues,
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
      negotiationId: cartItem.negotiationId,
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

    if (cartItem.negotiation) {
      baseItem.negotiation = {
        id: cartItem.negotiation.id,
        originalPrice: Number(cartItem.negotiation.originalPrice),
        finalPrice: Number(cartItem.negotiation.finalPrice),
        status: cartItem.negotiation.status,
        expiresAt: cartItem.negotiation.expiresAt,
      };
    }

    return baseItem;
  }

  private enrichCartItemWithProduct(
    cartItem: any,
    product: any,
    variantId?: string,
    negotiation?: any,
  ): CartItem {
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

    if (negotiation) {
      transformedItem.negotiation = {
        id: negotiation.id,
        originalPrice: Number(negotiation.originalPrice),
        finalPrice: Number(negotiation.finalPrice),
        status: negotiation.status,
        expiresAt: negotiation.expiresAt,
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

  private async validateProductAndNegotiation(
    productId: string,
    userId: string,
    quantity: number,
    variantId?: string,
    negotiationId?: string,
  ) {
    // Validate product
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
        variants: variantId ? { where: { id: variantId, isActive: true } } : undefined,
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    if (product.status !== 'PUBLISHED') {
      throw new AppError('Product is not available for purchase', 400, 'PRODUCT_UNAVAILABLE');
    }

    if (product.sellerId === userId) {
      throw new AppError('You cannot add your own product to cart', 400, 'CANNOT_BUY_OWN_PRODUCT');
    }

    let availableQuantity = product.quantity;
    let basePrice = product.discountPrice || product.price;

    // Handle variant
    if (variantId) {
      const variant = product.variants?.[0];
      if (!variant) {
        throw new AppError('Product variant not found', 404, 'VARIANT_NOT_FOUND');
      }
      availableQuantity = variant.quantity;
      basePrice = variant.discountPrice || variant.price || basePrice;
    }

    let finalPrice = Number(basePrice);
    let validatedNegotiation = null;

    // Validate negotiation nếu có
    if (negotiationId) {
      const negotiation = await this.prisma.priceNegotiation.findUnique({
        where: { id: negotiationId },
      });

      if (!negotiation) {
        throw new AppError('Price negotiation not found', 404, 'NEGOTIATION_NOT_FOUND');
      }

      // Validate negotiation conditions
      if (negotiation.customerId !== userId) {
        throw new AppError('You can only use your own negotiations', 403, 'NEGOTIATION_NOT_YOURS');
      }

      if (negotiation.productId !== productId) {
        throw new AppError(
          'Negotiation is for different product',
          400,
          'NEGOTIATION_PRODUCT_MISMATCH',
        );
      }

      if (negotiation.status !== 'ACCEPTED') {
        throw new AppError(
          'Only accepted negotiations can be used',
          400,
          'NEGOTIATION_NOT_ACCEPTED',
        );
      }

      if (negotiation.expiresAt && negotiation.expiresAt < new Date()) {
        throw new AppError('This price negotiation has expired', 400, 'NEGOTIATION_EXPIRED');
      }

      if (quantity > negotiation.quantity) {
        throw new AppError(
          `Requested quantity (${quantity}) exceeds negotiated quantity (${negotiation.quantity})`,
          400,
          'EXCEEDS_NEGOTIATED_QUANTITY',
        );
      }

      // Check if negotiation already used in another cart item
      const existingUsage = await this.prisma.cartItem.findFirst({
        where: {
          negotiationId,
          userId: { not: userId }, // Khác user hiện tại
        },
      });

      if (existingUsage) {
        throw new AppError('This negotiation is already in use', 400, 'NEGOTIATION_ALREADY_USED');
      }

      finalPrice = Number(negotiation.finalPrice);
      validatedNegotiation = negotiation;
    }

    // Validate quantity availability
    if (availableQuantity < quantity) {
      throw new AppError(
        `Insufficient stock. Only ${availableQuantity} available.`,
        400,
        'INSUFFICIENT_STOCK',
      );
    }

    return { product, finalPrice, validatedNegotiation };
  }
}
