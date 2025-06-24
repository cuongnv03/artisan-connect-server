import { PrismaClient, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IOrderRepository } from './OrderRepository.interface';
import {
  Order,
  OrderWithDetails,
  OrderSummary,
  PaymentTransaction,
  CreateOrderFromCartDto,
  CreateOrderFromQuoteDto,
  UpdateOrderStatusDto,
  ProcessPaymentDto,
  OrderQueryOptions,
  OrderStats,
  OrderDispute,
  OrderDisputeWithDetails,
  CreateDisputeDto,
  UpdateDisputeDto,
  DisputeQueryOptions,
  OrderReturn,
  OrderReturnWithDetails,
  CreateReturnDto,
  UpdateReturnDto,
  ReturnQueryOptions,
} from '../models/Order';
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethodType,
  DeliveryStatus,
} from '../models/OrderEnums';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class OrderRepository
  extends BasePrismaRepository<Order, string>
  implements IOrderRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'order');
  }

  async createOrderFromCart(
    userId: string,
    data: CreateOrderFromCartDto,
  ): Promise<OrderWithDetails> {
    try {
      const createdOrder = await this.prisma.$transaction(async (tx) => {
        // Get cart items with variants
        const cartItems = await tx.cartItem.findMany({
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
        });

        if (cartItems.length === 0) {
          throw new AppError('Cart is empty', 400, 'EMPTY_CART');
        }

        // Validate products and variants, calculate totals
        let subtotal = 0;
        const orderItems: any[] = [];

        for (const item of cartItems) {
          const product = item.product;

          if (!product || product.status !== 'PUBLISHED') {
            throw new AppError(
              `Product ${product?.name || 'Unknown'} is not available`,
              400,
              'PRODUCT_UNAVAILABLE',
            );
          }

          let availableQuantity = product.quantity;
          let price = product.discountPrice || product.price;

          // Handle variant-specific validation
          if (item.variantId && item.variant) {
            availableQuantity = item.variant.quantity;
            price = item.variant.discountPrice || item.variant.price || price;

            if (!item.variant.isActive) {
              throw new AppError(`Product variant is not available`, 400, 'VARIANT_UNAVAILABLE');
            }
          }

          if (availableQuantity < item.quantity) {
            const productName = item.variant?.name || product.name;
            throw new AppError(`Insufficient stock for ${productName}`, 400, 'INSUFFICIENT_STOCK');
          }

          subtotal += Number(price) * item.quantity;

          orderItems.push({
            productId: item.productId,
            variantId: item.variantId,
            sellerId: product.sellerId,
            quantity: item.quantity,
            price: price,
          });

          // Update stock
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { quantity: { decrement: item.quantity } },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { decrement: item.quantity } },
            });
          }
        }

        // Validate address
        const address = await tx.address.findFirst({
          where: {
            id: data.addressId,
            profile: {
              userId: userId,
            },
          },
        });

        if (!address) {
          throw new AppError('Invalid shipping address', 400, 'INVALID_ADDRESS');
        }

        // Calculate costs
        const shippingCost = subtotal > 50 ? 0 : 10; // Free shipping over $50
        const taxAmount = subtotal * 0.08; // 8% tax
        const discountAmount = 0; // No discount for now
        const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;

        // Generate order number
        const orderNumber = await this.generateOrderNumber();

        // Create initial status history
        const initialStatusHistory = [
          {
            status: OrderStatus.PENDING,
            note: 'Order created from cart',
            timestamp: new Date().toISOString(),
            updatedBy: userId,
          },
        ];

        // Calculate return deadline (30 days from now)
        const returnDeadline = new Date();
        returnDeadline.setDate(returnDeadline.getDate() + 30);

        // Create order
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            addressId: data.addressId,
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
            totalAmount,
            subtotal,
            shippingCost,
            taxAmount,
            discountAmount,
            paymentMethod: data.paymentMethod,
            deliveryStatus: DeliveryStatus.PREPARING,
            canReturn: true,
            returnDeadline,
            hasDispute: false,
            isRated: false,
            isDeliveryLate: false,
            notes: data.notes,
            statusHistory: initialStatusHistory,
            items: {
              create: orderItems,
            },
          },
        });

        // Mark negotiations as completed
        const negotiationIds = cartItems
          .filter((item) => item.negotiationId)
          .map((item) => item.negotiationId);

        if (negotiationIds.length > 0) {
          await tx.priceNegotiation.updateMany({
            where: {
              id: { in: negotiationIds },
              status: 'ACCEPTED',
            },
            data: {
              status: 'COMPLETED',
            },
          });
        }

        // Clear cart
        await tx.cartItem.deleteMany({
          where: { userId },
        });

        return order;
      });

      // Get full order details after transaction
      const orderWithDetails = await this.findByIdWithDetails(createdOrder.id);
      if (!orderWithDetails) {
        throw new AppError('Failed to retrieve order details', 500, 'ORDER_DETAILS_NOT_FOUND');
      }

      return orderWithDetails;
    } catch (error) {
      this.logger.error(`Error creating order from cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create order', 500, 'ORDER_CREATION_FAILED');
    }
  }

  async createOrderFromQuote(
    userId: string,
    data: CreateOrderFromQuoteDto,
  ): Promise<OrderWithDetails> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Get quote request
        const quote = await tx.quoteRequest.findUnique({
          where: { id: data.quoteRequestId },
          include: {
            referenceProduct: {
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

        if (!quote) {
          throw new AppError('Quote request not found', 404, 'QUOTE_NOT_FOUND');
        }

        if (quote.customerId !== userId) {
          throw new AppError('You can only create orders from your own quotes', 403, 'FORBIDDEN');
        }

        if (quote.status !== 'ACCEPTED') {
          throw new AppError(
            'Only accepted quotes can be converted to orders',
            400,
            'INVALID_QUOTE_STATUS',
          );
        }

        if (!quote.finalPrice) {
          throw new AppError('Quote has no final price', 400, 'NO_FINAL_PRICE');
        }

        // Validate address
        const address = await tx.address.findFirst({
          where: {
            id: data.addressId,
            profile: { userId },
          },
        });

        if (!address) {
          throw new AppError('Invalid shipping address', 400, 'INVALID_ADDRESS');
        }

        const subtotal = Number(quote.finalPrice);
        const shippingCost = 0; // Custom orders usually include shipping
        const taxAmount = subtotal * 0.08;
        const discountAmount = 0;
        const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;

        const orderNumber = await this.generateOrderNumber();

        const initialStatusHistory = [
          {
            status: OrderStatus.CONFIRMED,
            note: `Order created from accepted quote (${quote.id})`,
            timestamp: new Date().toISOString(),
            updatedBy: userId,
          },
        ];

        const returnDeadline = new Date();
        returnDeadline.setDate(returnDeadline.getDate() + 30);

        // ✅ Fix: Handle custom orders properly
        const orderItemData = {
          sellerId: quote.artisanId,
          quantity: 1,
          price: quote.finalPrice,
          customOrderId: quote.id,
          isCustomOrder: true,
          customTitle: quote.title,
          customDescription: quote.description,
        };

        // Add productId only if reference product exists
        if (quote.referenceProductId) {
          orderItemData.productId = quote.referenceProductId;
        }

        // Create order
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            addressId: data.addressId,
            status: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PENDING,
            totalAmount,
            subtotal,
            shippingCost,
            taxAmount,
            discountAmount,
            paymentMethod: data.paymentMethod,
            deliveryStatus: DeliveryStatus.PREPARING,
            canReturn: true,
            returnDeadline,
            hasDispute: false,
            isRated: false,
            isDeliveryLate: false,
            notes: data.notes || `Custom order from quote: ${quote.title}`,
            statusHistory: initialStatusHistory,
            items: {
              create: orderItemData,
            },
          },
        });

        // Update quote status to COMPLETED
        await tx.quoteRequest.update({
          where: { id: quote.id },
          data: { status: 'COMPLETED' },
        });

        return (await this.findByIdWithDetails(order.id)) as OrderWithDetails;
      });
    } catch (error) {
      this.logger.error(`Error creating order from quote: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create order from quote', 500, 'ORDER_CREATION_FAILED');
    }
  }

  async findByIdWithDetails(id: string): Promise<OrderWithDetails | null> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          shippingAddress: true,
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  attributes: true,
                },
              },
              seller: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  username: true,
                  artisanProfile: {
                    select: {
                      shopName: true,
                      isVerified: true,
                    },
                  },
                },
              },
              // ✅ Add custom order relation
              customOrder: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                },
              },
            },
          },
          paymentTransactions: {
            orderBy: { createdAt: 'desc' },
          },
          disputes: {
            include: {
              complainant: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          returns: {
            include: {
              requester: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!order) return null;

      return {
        ...order,
        totalAmount: Number(order.totalAmount),
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        taxAmount: order.taxAmount ? Number(order.taxAmount) : null,
        discountAmount: order.discountAmount ? Number(order.discountAmount) : null,
        items: order.items.map((item) => ({
          ...item,
          price: Number(item.price),
          // ✅ Handle custom order display name
          displayName: item.isCustomOrder
            ? item.customTitle || item.customOrder?.title || 'Custom Order'
            : item.product?.name || 'Product',
        })),
        paymentTransactions: order.paymentTransactions.map((tx) => ({
          ...tx,
          amount: Number(tx.amount),
        })),
        disputes: order.disputes.map((dispute) => ({
          ...dispute,
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
          },
        })),
        returns: order.returns.map((returnReq) => ({
          ...returnReq,
          refundAmount: returnReq.refundAmount ? Number(returnReq.refundAmount) : null,
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
          },
        })),
      } as OrderWithDetails;
    } catch (error) {
      this.logger.error(`Error finding order by ID ${id}: ${error}`);
      return null;
    }
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderWithDetails | null> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { orderNumber },
      });

      if (!order) return null;

      return await this.findByIdWithDetails(order.id);
    } catch (error) {
      this.logger.error(`Error finding order by number: ${error}`);
      return null;
    }
  }

  async updateOrderStatus(
    id: string,
    data: UpdateOrderStatusDto,
    updatedBy?: string,
  ): Promise<OrderWithDetails> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Get current order
        const currentOrder = await tx.order.findUnique({
          where: { id },
          select: { status: true, statusHistory: true, deliveryStatus: true },
        });

        if (!currentOrder) {
          throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }

        // Validate status transition
        this.validateStatusTransition(currentOrder.status as OrderStatus, data.status);

        // Prepare status history
        const currentHistory = Array.isArray(currentOrder.statusHistory)
          ? currentOrder.statusHistory
          : [];

        const newHistoryEntry = {
          status: data.status,
          note: data.note,
          timestamp: new Date().toISOString(),
          updatedBy: updatedBy,
        };

        const updatedHistory = [...currentHistory, newHistoryEntry];

        // Determine delivery status based on order status
        let deliveryStatus = currentOrder.deliveryStatus;
        if (data.status === OrderStatus.SHIPPED) {
          deliveryStatus = DeliveryStatus.SHIPPED;
        } else if (data.status === OrderStatus.DELIVERED) {
          deliveryStatus = DeliveryStatus.DELIVERED;
        }

        // Update order
        await tx.order.update({
          where: { id },
          data: {
            status: data.status,
            deliveryStatus,
            expectedDelivery: data.estimatedDelivery,
            actualDelivery: data.status === OrderStatus.DELIVERED ? new Date() : undefined,
            statusHistory: updatedHistory,
            updatedAt: new Date(),
          },
        });

        return (await this.findByIdWithDetails(id)) as OrderWithDetails;
      });
    } catch (error) {
      this.logger.error(`Error updating order status: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update order status', 500, 'ORDER_UPDATE_FAILED');
    }
  }

  async cancelOrder(id: string, reason?: string, cancelledBy?: string): Promise<OrderWithDetails> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id },
          include: { items: true },
        });

        if (!order) {
          throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }

        // Only allow cancellation of certain statuses
        const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PAID];
        if (!cancellableStatuses.includes(order.status as OrderStatus)) {
          throw new AppError(
            `Cannot cancel order in ${order.status} status`,
            400,
            'INVALID_STATUS_FOR_CANCELLATION',
          );
        }

        // Prepare status history
        const currentHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
        const newHistoryEntry = {
          status: OrderStatus.CANCELLED,
          note: reason || 'Order cancelled',
          timestamp: new Date().toISOString(),
          updatedBy: cancelledBy,
        };
        const updatedHistory = [...currentHistory, newHistoryEntry];

        // Update order status
        await tx.order.update({
          where: { id },
          data: {
            status: OrderStatus.CANCELLED,
            paymentStatus:
              order.paymentStatus === PaymentStatus.COMPLETED
                ? PaymentStatus.REFUNDED
                : order.paymentStatus,
            statusHistory: updatedHistory,
            updatedAt: new Date(),
          },
        });

        // Restore product quantities
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { quantity: { increment: item.quantity } },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { increment: item.quantity } },
            });
          }
        }

        return (await this.findByIdWithDetails(id)) as OrderWithDetails;
      });
    } catch (error) {
      this.logger.error(`Error cancelling order: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cancel order', 500, 'ORDER_CANCELLATION_FAILED');
    }
  }

  async processPayment(id: string, data: ProcessPaymentDto): Promise<OrderWithDetails> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id },
          select: { totalAmount: true, userId: true, paymentStatus: true, statusHistory: true },
        });

        if (!order) {
          throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }

        if (order.paymentStatus === PaymentStatus.COMPLETED) {
          throw new AppError('Order is already paid', 400, 'ORDER_ALREADY_PAID');
        }

        // Create payment transaction
        const paymentTransaction = await tx.paymentTransaction.create({
          data: {
            orderId: id,
            userId: order.userId,
            paymentMethodId: data.paymentMethodId,
            amount: order.totalAmount,
            currency: 'VND',
            status: PaymentStatus.COMPLETED,
            paymentMethodType: PaymentMethodType.CREDIT_CARD,
            reference: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            externalReference: data.externalReference,
            processedAt: new Date(),
          },
        });

        // Update status history
        const currentHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
        const newHistoryEntry = {
          status: OrderStatus.PAID,
          note: 'Payment completed successfully',
          timestamp: new Date().toISOString(),
          updatedBy: null,
        };
        const updatedHistory = [...currentHistory, newHistoryEntry];

        // Update order payment status
        await tx.order.update({
          where: { id },
          data: {
            paymentStatus: PaymentStatus.COMPLETED,
            paymentReference: paymentTransaction.reference,
            status: OrderStatus.PAID,
            statusHistory: updatedHistory,
            updatedAt: new Date(),
          },
        });

        return (await this.findByIdWithDetails(id)) as OrderWithDetails;
      });
    } catch (error) {
      this.logger.error(`Error processing payment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to process payment', 500, 'PAYMENT_PROCESSING_FAILED');
    }
  }

  async addStatusToHistory(
    orderId: string,
    status: OrderStatus,
    note?: string,
    updatedBy?: string,
  ): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { statusHistory: true },
      });

      if (!order) {
        throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
      }

      const currentHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      const newHistoryEntry = {
        status,
        note,
        timestamp: new Date().toISOString(),
        updatedBy,
      };
      const updatedHistory = [...currentHistory, newHistoryEntry];

      await this.prisma.order.update({
        where: { id: orderId },
        data: { statusHistory: updatedHistory },
      });
    } catch (error) {
      this.logger.error(`Error adding status to history: ${error}`);
      throw new AppError('Failed to add status to history', 500, 'STATUS_HISTORY_FAILED');
    }
  }

  async getStatusHistory(orderId: string): Promise<any[]> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { statusHistory: true },
      });

      if (!order) {
        return [];
      }

      return Array.isArray(order.statusHistory) ? order.statusHistory : [];
    } catch (error) {
      this.logger.error(`Error getting status history: ${error}`);
      return [];
    }
  }

  // Continue with other methods...
  async generateOrderNumber(): Promise<string> {
    const currentDate = new Date();
    const year = currentDate.getFullYear().toString().substr(-2);
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');

    const todayStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
    );
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayOrderCount = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    const sequence = String(todayOrderCount + 1).padStart(4, '0');
    return `AC${year}${month}${day}${sequence}`;
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    if (currentStatus === newStatus) return;

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        400,
        'INVALID_STATUS_TRANSITION',
      );
    }
  }

  async getOrders(options: OrderQueryOptions): Promise<PaginatedResult<OrderSummary>> {
    try {
      const {
        page = 1,
        limit = 10,
        userId,
        sellerId,
        status,
        paymentStatus,
        deliveryStatus,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const where: Prisma.OrderWhereInput = {};

      if (userId) where.userId = userId;
      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      }
      if (paymentStatus) {
        where.paymentStatus = Array.isArray(paymentStatus) ? { in: paymentStatus } : paymentStatus;
      }
      if (deliveryStatus) {
        where.deliveryStatus = Array.isArray(deliveryStatus)
          ? { in: deliveryStatus }
          : deliveryStatus;
      }
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }
      if (sellerId) {
        where.items = {
          some: { sellerId },
        };
      }

      const total = await this.prisma.order.count({ where });

      const orders = await this.prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              seller: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  artisanProfile: {
                    select: { shopName: true },
                  },
                },
              },
            },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      });

      const orderSummaries: OrderSummary[] = orders.map((order) => {
        const primarySeller = order.items[0]?.seller;

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status as OrderStatus,
          paymentStatus: order.paymentStatus as PaymentStatus,
          deliveryStatus: order.deliveryStatus as DeliveryStatus,
          totalAmount: Number(order.totalAmount),
          itemCount: order._count.items,
          createdAt: order.createdAt,
          customer: order.customer
            ? {
                id: order.customer.id,
                name: `${order.customer.firstName} ${order.customer.lastName}`,
                email: order.customer.email,
              }
            : undefined,
          primarySeller: primarySeller
            ? {
                id: primarySeller.id,
                name: `${primarySeller.firstName} ${primarySeller.lastName}`,
                shopName: primarySeller.artisanProfile?.shopName,
              }
            : undefined,
        };
      });

      return {
        data: orderSummaries,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting orders: ${error}`);
      throw new AppError('Failed to get orders', 500, 'ORDER_QUERY_FAILED');
    }
  }

  async getCustomerOrders(
    userId: string,
    options: Partial<OrderQueryOptions> = {},
  ): Promise<PaginatedResult<OrderSummary>> {
    return this.getOrders({ ...options, userId });
  }

  async getSellerOrders(
    sellerId: string,
    options: Partial<OrderQueryOptions> = {},
  ): Promise<PaginatedResult<OrderSummary>> {
    return this.getOrders({ ...options, sellerId });
  }

  async refundPayment(id: string, reason?: string): Promise<OrderWithDetails> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id },
          select: { totalAmount: true, userId: true, paymentStatus: true, statusHistory: true },
        });

        if (!order) {
          throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }

        if (order.paymentStatus !== PaymentStatus.COMPLETED) {
          throw new AppError('Order payment is not completed', 400, 'PAYMENT_NOT_COMPLETED');
        }

        // Create refund transaction
        await tx.paymentTransaction.create({
          data: {
            orderId: id,
            userId: order.userId,
            amount: -order.totalAmount,
            currency: 'VND',
            status: PaymentStatus.REFUNDED,
            paymentMethodType: PaymentMethodType.CREDIT_CARD,
            reference: `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            processedAt: new Date(),
          },
        });

        // Update status history
        const currentHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
        const newHistoryEntry = {
          status: OrderStatus.REFUNDED,
          note: reason || 'Payment refunded',
          timestamp: new Date().toISOString(),
          updatedBy: null,
        };
        const updatedHistory = [...currentHistory, newHistoryEntry];

        // Update order
        await tx.order.update({
          where: { id },
          data: {
            paymentStatus: PaymentStatus.REFUNDED,
            status: OrderStatus.REFUNDED,
            statusHistory: updatedHistory,
            updatedAt: new Date(),
          },
        });

        return (await this.findByIdWithDetails(id)) as OrderWithDetails;
      });
    } catch (error) {
      this.logger.error(`Error refunding payment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to refund payment', 500, 'REFUND_FAILED');
    }
  }

  async getOrderStats(userId?: string, sellerId?: string): Promise<OrderStats> {
    try {
      const where: Prisma.OrderWhereInput = {};

      if (userId) where.userId = userId;
      if (sellerId) {
        where.items = { some: { sellerId } };
      }

      const [totalStats, statusCounts] = await Promise.all([
        this.prisma.order.aggregate({
          where,
          _count: { id: true },
          _sum: { totalAmount: true },
        }),
        this.prisma.order.groupBy({
          by: ['status'],
          where,
          _count: { id: true },
        }),
      ]);

      const statusMap = new Map(statusCounts.map((s) => [s.status, s._count.id]));

      return {
        totalOrders: totalStats._count.id || 0,
        pendingOrders: statusMap.get('PENDING') || 0,
        completedOrders: statusMap.get('DELIVERED') || 0,
        cancelledOrders: statusMap.get('CANCELLED') || 0,
        totalRevenue: Number(totalStats._sum.totalAmount) || 0,
        averageOrderValue:
          totalStats._count.id > 0 ? Number(totalStats._sum.totalAmount) / totalStats._count.id : 0,
      };
    } catch (error) {
      this.logger.error(`Error getting order stats: ${error}`);
      throw new AppError('Failed to get order stats', 500, 'ORDER_STATS_FAILED');
    }
  }

  async isUserInvolvedInOrder(orderId: string, userId: string): Promise<boolean> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) return false;

      // Check if user is the customer
      if (order.userId === userId) return true;

      // Check if user is a seller
      return order.items.some((item) => item.sellerId === userId);
    } catch (error) {
      this.logger.error(`Error checking user involvement: ${error}`);
      return false;
    }
  }

  // DISPUTE METHODS
  async createDispute(
    data: CreateDisputeDto & { complainantId: string },
  ): Promise<OrderDisputeWithDetails> {
    try {
      const dispute = await this.prisma.orderDispute.create({
        data: {
          orderId: data.orderId,
          complainantId: data.complainantId,
          type: data.type,
          reason: data.reason,
          evidence: data.evidence || [],
          status: 'OPEN',
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          complainant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Update order hasDispute flag
      await this.prisma.order.update({
        where: { id: data.orderId },
        data: { hasDispute: true },
      });

      return dispute as OrderDisputeWithDetails;
    } catch (error) {
      this.logger.error(`Error creating dispute: ${error}`);
      throw new AppError('Failed to create dispute', 500, 'DISPUTE_CREATE_FAILED');
    }
  }

  async updateDispute(
    id: string,
    data: UpdateDisputeDto,
    updatedBy?: string,
  ): Promise<OrderDisputeWithDetails> {
    try {
      const dispute = await this.prisma.orderDispute.update({
        where: { id },
        data: {
          status: data.status,
          resolution: data.resolution,
          resolvedBy: updatedBy,
          resolvedAt:
            data.status === 'RESOLVED' || data.status === 'CLOSED' ? new Date() : undefined,
          updatedAt: new Date(),
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          complainant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return dispute as OrderDisputeWithDetails;
    } catch (error) {
      this.logger.error(`Error updating dispute: ${error}`);
      throw new AppError('Failed to update dispute', 500, 'DISPUTE_UPDATE_FAILED');
    }
  }

  // RETURN METHODS
  async createReturn(
    data: CreateReturnDto & { requesterId: string },
  ): Promise<OrderReturnWithDetails> {
    try {
      const returnRequest = await this.prisma.orderReturn.create({
        data: {
          orderId: data.orderId,
          requesterId: data.requesterId,
          reason: data.reason,
          description: data.description,
          evidence: data.evidence || [],
          status: 'REQUESTED',
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return returnRequest as OrderReturnWithDetails;
    } catch (error) {
      this.logger.error(`Error creating return: ${error}`);
      throw new AppError('Failed to create return', 500, 'RETURN_CREATE_FAILED');
    }
  }

  // DISPUTE METHODS
  async getDisputes(
    options: DisputeQueryOptions,
  ): Promise<PaginatedResult<OrderDisputeWithDetails>> {
    try {
      const { page = 1, limit = 10, status, type, dateFrom, dateTo } = options;

      const where: Prisma.OrderDisputeWhereInput = {};

      if (status) where.status = status;
      if (type) where.type = type;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const total = await this.prisma.orderDispute.count({ where });

      const disputes = await this.prisma.orderDispute.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          complainant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: disputes as OrderDisputeWithDetails[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting disputes: ${error}`);
      throw new AppError('Failed to get disputes', 500, 'DISPUTE_QUERY_FAILED');
    }
  }

  async getUserDisputes(
    userId: string,
    options: Partial<DisputeQueryOptions> = {},
  ): Promise<PaginatedResult<OrderDisputeWithDetails>> {
    try {
      const { page = 1, limit = 10, status, type, dateFrom, dateTo } = options;

      const where: Prisma.OrderDisputeWhereInput = {
        OR: [
          { complainantId: userId },
          {
            order: {
              items: {
                some: { sellerId: userId },
              },
            },
          },
        ],
      };

      if (status) where.status = status;
      if (type) where.type = type;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const total = await this.prisma.orderDispute.count({ where });

      const disputes = await this.prisma.orderDispute.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          complainant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: disputes as OrderDisputeWithDetails[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting user disputes: ${error}`);
      throw new AppError('Failed to get user disputes', 500, 'USER_DISPUTE_QUERY_FAILED');
    }
  }

  async getDisputeById(id: string): Promise<OrderDisputeWithDetails | null> {
    try {
      const dispute = await this.prisma.orderDispute.findUnique({
        where: { id },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              userId: true,
              items: {
                select: {
                  sellerId: true,
                },
              },
            },
          },
          complainant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return dispute as OrderDisputeWithDetails | null;
    } catch (error) {
      this.logger.error(`Error getting dispute by ID: ${error}`);
      return null;
    }
  }

  // RETURN METHODS
  async updateReturn(
    id: string,
    data: UpdateReturnDto,
    updatedBy?: string,
  ): Promise<OrderReturnWithDetails> {
    try {
      const updateData: any = {
        status: data.status,
        updatedAt: new Date(),
      };

      if (data.refundAmount !== undefined) {
        updateData.refundAmount = data.refundAmount;
      }

      if (data.refundReason !== undefined) {
        updateData.refundReason = data.refundReason;
      }

      if (data.status === 'APPROVED' || data.status === 'REJECTED') {
        updateData.approvedBy = updatedBy;
      }

      const returnRequest = await this.prisma.orderReturn.update({
        where: { id },
        data: updateData,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return {
        ...returnRequest,
        refundAmount: returnRequest.refundAmount ? Number(returnRequest.refundAmount) : null,
      } as OrderReturnWithDetails;
    } catch (error) {
      this.logger.error(`Error updating return: ${error}`);
      throw new AppError('Failed to update return', 500, 'RETURN_UPDATE_FAILED');
    }
  }

  async getReturns(options: ReturnQueryOptions): Promise<PaginatedResult<OrderReturnWithDetails>> {
    try {
      const { page = 1, limit = 10, status, reason, dateFrom, dateTo } = options;

      const where: Prisma.OrderReturnWhereInput = {};

      if (status) where.status = status;
      if (reason) where.reason = reason;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const total = await this.prisma.orderReturn.count({ where });

      const returns = await this.prisma.orderReturn.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: returns.map((returnReq) => ({
          ...returnReq,
          refundAmount: returnReq.refundAmount ? Number(returnReq.refundAmount) : null,
        })) as OrderReturnWithDetails[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting returns: ${error}`);
      throw new AppError('Failed to get returns', 500, 'RETURN_QUERY_FAILED');
    }
  }

  async getUserReturns(
    userId: string,
    options: Partial<ReturnQueryOptions> = {},
  ): Promise<PaginatedResult<OrderReturnWithDetails>> {
    try {
      const { page = 1, limit = 10, status, reason, dateFrom, dateTo } = options;

      const where: Prisma.OrderReturnWhereInput = {
        OR: [
          { requesterId: userId },
          {
            order: {
              items: {
                some: { sellerId: userId },
              },
            },
          },
        ],
      };

      if (status) where.status = status;
      if (reason) where.reason = reason;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const total = await this.prisma.orderReturn.count({ where });

      const returns = await this.prisma.orderReturn.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: returns.map((returnReq) => ({
          ...returnReq,
          refundAmount: returnReq.refundAmount ? Number(returnReq.refundAmount) : null,
        })) as OrderReturnWithDetails[],
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting user returns: ${error}`);
      throw new AppError('Failed to get user returns', 500, 'USER_RETURN_QUERY_FAILED');
    }
  }

  async getReturnById(id: string): Promise<OrderReturnWithDetails | null> {
    try {
      const returnRequest = await this.prisma.orderReturn.findUnique({
        where: { id },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              userId: true,
              items: {
                select: {
                  sellerId: true,
                },
              },
            },
          },
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!returnRequest) return null;

      return {
        ...returnRequest,
        refundAmount: returnRequest.refundAmount ? Number(returnRequest.refundAmount) : null,
      } as OrderReturnWithDetails;
    } catch (error) {
      this.logger.error(`Error getting return by ID: ${error}`);
      return null;
    }
  }

  // HELPER METHODS for validation and access control
  async canUserAccessDispute(disputeId: string, userId: string): Promise<boolean> {
    try {
      const dispute = await this.prisma.orderDispute.findUnique({
        where: { id: disputeId },
        include: {
          order: {
            include: {
              items: {
                select: { sellerId: true },
              },
            },
          },
        },
      });

      if (!dispute) return false;

      // User is complainant
      if (dispute.complainantId === userId) return true;

      // User is customer of the order
      if (dispute.order.userId === userId) return true;

      // User is seller in the order
      const isSeller = dispute.order.items.some((item) => item.sellerId === userId);
      if (isSeller) return true;

      return false;
    } catch (error) {
      this.logger.error(`Error checking dispute access: ${error}`);
      return false;
    }
  }

  async canUserAccessReturn(returnId: string, userId: string): Promise<boolean> {
    try {
      const returnRequest = await this.prisma.orderReturn.findUnique({
        where: { id: returnId },
        include: {
          order: {
            include: {
              items: {
                select: { sellerId: true },
              },
            },
          },
        },
      });

      if (!returnRequest) return false;

      // User is requester
      if (returnRequest.requesterId === userId) return true;

      // User is customer of the order
      if (returnRequest.order.userId === userId) return true;

      // User is seller in the order
      const isSeller = returnRequest.order.items.some((item) => item.sellerId === userId);
      if (isSeller) return true;

      return false;
    } catch (error) {
      this.logger.error(`Error checking return access: ${error}`);
      return false;
    }
  }

  async canUserCreateDispute(orderId: string, userId: string): Promise<boolean> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          userId: true,
          status: true,
          hasDispute: true,
          deliveryStatus: true,
        },
      });

      if (!order) return false;

      // Only customer can create dispute
      if (order.userId !== userId) return false;

      // Cannot create dispute if one already exists
      if (order.hasDispute) return false;

      // Can only create dispute for certain order statuses
      const allowedStatuses = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
      if (!allowedStatuses.includes(order.status)) return false;

      return true;
    } catch (error) {
      this.logger.error(`Error checking dispute creation: ${error}`);
      return false;
    }
  }

  async canUserCreateReturn(orderId: string, userId: string): Promise<boolean> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          userId: true,
          status: true,
          canReturn: true,
          returnDeadline: true,
          deliveryStatus: true,
        },
      });

      if (!order) return false;

      // Only customer can create return
      if (order.userId !== userId) return false;

      // Check if returns are allowed
      if (!order.canReturn) return false;

      // Check return deadline
      if (order.returnDeadline && new Date() > order.returnDeadline) return false;

      // Can only return delivered orders
      if (order.status !== 'DELIVERED') return false;

      // Check if return already exists
      const existingReturn = await this.prisma.orderReturn.findFirst({
        where: { orderId, requesterId: userId },
      });

      if (existingReturn) return false;

      return true;
    } catch (error) {
      this.logger.error(`Error checking return creation: ${error}`);
      return false;
    }
  }
}
