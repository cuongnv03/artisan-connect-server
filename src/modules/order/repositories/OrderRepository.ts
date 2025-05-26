import { PrismaClient, Prisma } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IOrderRepository } from './OrderRepository.interface';
import {
  Order,
  OrderWithDetails,
  OrderSummary,
  OrderStatusHistory,
  PaymentTransaction,
  CreateOrderFromCartDto,
  CreateOrderFromQuoteDto,
  UpdateOrderStatusDto,
  ProcessPaymentDto,
  OrderQueryOptions,
  OrderStats,
} from '../models/Order';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../models/OrderEnums';
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
        // Get cart items
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
          },
        });

        if (cartItems.length === 0) {
          throw new AppError('Cart is empty', 400, 'EMPTY_CART');
        }

        // Validate products and calculate totals
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

          if (product.quantity < item.quantity) {
            throw new AppError(`Insufficient stock for ${product.name}`, 400, 'INSUFFICIENT_STOCK');
          }

          const price = product.discountPrice || product.price;
          subtotal += Number(price) * item.quantity;

          orderItems.push({
            productId: item.productId,
            sellerId: product.sellerId,
            quantity: item.quantity,
            price: price,
          });

          // Update product quantity
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } },
          });
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

        // Calculate shipping cost (simplified)
        const shippingCost = subtotal > 50 ? 0 : 10; // Free shipping over $50
        const totalAmount = subtotal + shippingCost;

        // Generate order number
        const orderNumber = await this.generateOrderNumber();

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
            paymentMethod: data.paymentMethod,
            notes: data.notes,
            items: {
              create: orderItems,
            },
          },
        });

        // Add initial status history
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: OrderStatus.PENDING,
            note: 'Order created from cart',
            createdBy: userId,
          },
        });

        // Clear cart
        await tx.cartItem.deleteMany({
          where: { userId },
        });

        return order;
      });

      // Get full order details after transaction
      const orderWithDetails = await this.findByIdWithDetails(createdOrder.id);

      if (!orderWithDetails) {
        this.logger.error(`Failed to retrieve order details for order ${createdOrder.id}`);
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
        const totalAmount = subtotal + shippingCost;

        // Generate order number
        const orderNumber = await this.generateOrderNumber();

        // Create order
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            addressId: data.addressId,
            status: OrderStatus.CONFIRMED, // Custom orders start as confirmed
            paymentStatus: PaymentStatus.PENDING,
            totalAmount,
            subtotal,
            shippingCost,
            paymentMethod: data.paymentMethod,
            notes: data.notes || `Custom order from quote: ${quote.specifications}`,
            items: {
              create: {
                productId: quote.productId,
                sellerId: quote.artisanId,
                quantity: 1, // Custom orders are typically quantity 1
                price: quote.finalPrice,
              },
            },
          },
        });

        // Add status history
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: OrderStatus.CONFIRMED,
            note: `Order created from accepted quote (${quote.id})`,
            createdBy: userId,
          },
        });

        // Update quote status
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

  // src/modules/order/repositories/OrderRepository.ts

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
                  isCustomizable: true,
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
            },
          },
          paymentTransactions: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!order) {
        this.logger.warn(`Order not found: ${id}`);
        return null;
      }

      // Get status history separately
      let statusHistory: OrderStatusHistory[] = [];
      try {
        statusHistory = await this.getOrderStatusHistory(id);
      } catch (error) {
        this.logger.error(`Error getting status history for order ${id}: ${error}`);
        // Continue without status history rather than failing
      }

      return {
        ...order,
        statusHistory,
        totalAmount: Number(order.totalAmount),
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        items: order.items.map((item) => ({
          ...item,
          price: Number(item.price),
        })),
        paymentTransactions: order.paymentTransactions.map((tx) => ({
          ...tx,
          amount: Number(tx.amount),
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

  async getOrders(options: OrderQueryOptions): Promise<PaginatedResult<OrderSummary>> {
    try {
      const {
        page = 1,
        limit = 10,
        userId,
        sellerId,
        status,
        paymentStatus,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const where: Prisma.OrderWhereInput = {};

      // Filters
      if (userId) where.userId = userId;
      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      }
      if (paymentStatus) {
        where.paymentStatus = Array.isArray(paymentStatus) ? { in: paymentStatus } : paymentStatus;
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
        // Get primary seller (first item's seller)
        const primarySeller = order.items[0]?.seller;

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status as OrderStatus,
          paymentStatus: order.paymentStatus as PaymentStatus,
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
          select: { status: true, paymentStatus: true },
        });

        if (!currentOrder) {
          throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
        }

        // Validate status transition
        this.validateStatusTransition(currentOrder.status as OrderStatus, data.status);

        // Update order
        await tx.order.update({
          where: { id },
          data: {
            status: data.status,
            trackingNumber: data.trackingNumber,
            estimatedDelivery: data.estimatedDelivery,
            deliveredAt: data.status === OrderStatus.DELIVERED ? new Date() : undefined,
            updatedAt: new Date(),
          },
        });

        // Add status history
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status: data.status,
            note: data.note,
            createdBy: updatedBy,
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

        // Update order status
        await tx.order.update({
          where: { id },
          data: {
            status: OrderStatus.CANCELLED,
            paymentStatus:
              order.paymentStatus === PaymentStatus.COMPLETED
                ? PaymentStatus.REFUNDED
                : order.paymentStatus,
            updatedAt: new Date(),
          },
        });

        // Restore product quantities
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { increment: item.quantity } },
          });
        }

        // Add status history
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status: OrderStatus.CANCELLED,
            note: reason || 'Order cancelled',
            createdBy: cancelledBy,
          },
        });

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
          select: { totalAmount: true, userId: true, paymentStatus: true },
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
            currency: 'USD',
            status: PaymentStatus.COMPLETED, // Simulate successful payment
            paymentMethod: 'CREDIT_CARD', // Simplified
            reference: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            externalReference: data.externalReference,
            processedAt: new Date(),
          },
        });

        // Update order payment status
        await tx.order.update({
          where: { id },
          data: {
            paymentStatus: PaymentStatus.COMPLETED,
            paymentReference: paymentTransaction.reference,
            status: OrderStatus.PAID,
            updatedAt: new Date(),
          },
        });

        // Add status history
        await this.addStatusHistory(id, OrderStatus.PAID, 'Payment completed successfully');

        return (await this.findByIdWithDetails(id)) as OrderWithDetails;
      });
    } catch (error) {
      this.logger.error(`Error processing payment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to process payment', 500, 'PAYMENT_PROCESSING_FAILED');
    }
  }

  async refundPayment(id: string, reason?: string): Promise<OrderWithDetails> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id },
          select: { totalAmount: true, userId: true, paymentStatus: true },
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
            amount: -order.totalAmount, // Negative amount for refund
            currency: 'USD',
            status: PaymentStatus.REFUNDED,
            paymentMethod: 'CREDIT_CARD',
            reference: `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            processedAt: new Date(),
          },
        });

        // Update order
        await tx.order.update({
          where: { id },
          data: {
            paymentStatus: PaymentStatus.REFUNDED,
            status: OrderStatus.REFUNDED,
            updatedAt: new Date(),
          },
        });

        // Add status history
        await this.addStatusHistory(id, OrderStatus.REFUNDED, reason || 'Payment refunded');

        return (await this.findByIdWithDetails(id)) as OrderWithDetails;
      });
    } catch (error) {
      this.logger.error(`Error refunding payment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to refund payment', 500, 'REFUND_FAILED');
    }
  }

  async getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    try {
      const history = await this.prisma.orderStatusHistory.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      });

      return history as OrderStatusHistory[];
    } catch (error) {
      this.logger.error(`Error getting order status history: ${error}`);
      return [];
    }
  }

  async addStatusHistory(
    orderId: string,
    status: OrderStatus,
    note?: string,
    createdBy?: string,
  ): Promise<OrderStatusHistory> {
    try {
      const history = await this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status,
          note,
          createdBy,
        },
      });

      return history as OrderStatusHistory;
    } catch (error) {
      this.logger.error(`Error adding status history: ${error}`);
      throw new AppError('Failed to add status history', 500, 'STATUS_HISTORY_FAILED');
    }
  }

  async generateOrderNumber(): Promise<string> {
    const currentDate = new Date();
    const year = currentDate.getFullYear().toString().substr(-2);
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');

    // Get today's order count
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
}
