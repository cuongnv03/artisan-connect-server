import { PrismaClient, Prisma } from '@prisma/client';
import { BasePrismaRepository } from './BasePrismaRepository';
import { IOrderRepository } from '../../../domain/order/repositories/OrderRepository.interface';
import {
  Order,
  OrderWithDetails,
  OrderSummary,
  OrderQueryOptions,
  CreateOrderFromCartDto,
  CreateOrderFromQuoteDto,
  UpdateOrderStatusDto,
  UpdateShippingInfoDto,
} from '../../../domain/order/entities/Order';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../../domain/order/valueObjects/OrderEnums';
import { OrderStatusHistory } from '../../../domain/order/entities/OrderStatusHistory';
import { PaginatedResult } from '../../../domain/common/PaginatedResult';
import { AppError } from '../../../shared/errors/AppError';
import { Logger } from '../../../shared/utils/Logger';

export class OrderRepository
  extends BasePrismaRepository<Order, string>
  implements IOrderRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'order');
  }

  /**
   * Find order by ID with details
   */
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
            },
          },
          shippingAddress: true,
          items: {
            include: {
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
          statusHistory: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          quoteRequest: {
            select: {
              id: true,
              finalPrice: true,
              specifications: true,
            },
          },
        },
      });

      if (!order) return null;

      return order as unknown as OrderWithDetails;
    } catch (error) {
      this.logger.error(`Error finding order by ID: ${error}`);
      return null;
    }
  }

  /**
   * Find order by order number
   */
  async findByOrderNumber(orderNumber: string): Promise<OrderWithDetails | null> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { orderNumber },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          shippingAddress: true,
          items: {
            include: {
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
          statusHistory: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          quoteRequest: {
            select: {
              id: true,
              finalPrice: true,
              specifications: true,
            },
          },
        },
      });

      if (!order) return null;

      return order as unknown as OrderWithDetails;
    } catch (error) {
      this.logger.error(`Error finding order by order number: ${error}`);
      return null;
    }
  }

  /**
   * Prepare order items from cart items
   * This method is used to create order items from cart items
   */
  async prepareOrderItemsFromCart(
    cartItems: any[],
  ): Promise<{ orderItems: any[]; subtotal: number }> {
    let subtotal = 0;

    // Create product snapshots and calculate subtotal
    const orderItems = cartItems.map((item) => {
      const price = item.product.discountPrice || item.product.price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      return {
        productId: item.productId,
        sellerId: item.product.sellerId,
        quantity: item.quantity,
        price,
        productData: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          images: item.product.images,
          attributes: item.product.attributes,
          isCustomizable: item.product.isCustomizable,
        },
      };
    });

    return { orderItems, subtotal };
  }

  /**
   * Create order with items
   * This method is used by both createOrderFromCart and createOrderFromQuote
   */
  async createOrderWithItems(
    userId: string,
    data: {
      orderNumber: string;
      addressId: string;
      paymentMethod: PaymentMethod;
      notes?: string;
      orderItems: any[];
      subtotal: number;
    },
  ): Promise<OrderWithDetails> {
    const { orderNumber, addressId, paymentMethod, notes, orderItems, subtotal } = data;

    // Apply shipping costs, tax, etc.
    const shippingCost = 0; // This could be calculated based on address, weight, etc.
    const tax = subtotal * 0.1; // 10% tax for example, could be calculated differently
    const discount = 0; // Apply coupon/discounts here
    const totalAmount = subtotal + shippingCost + tax - discount;

    // Create order in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId,
          status: OrderStatus.PENDING,
          totalAmount,
          subtotal,
          tax,
          shippingCost,
          discount,
          paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          notes,
          // Create initial status history
          statusHistory: {
            create: {
              status: OrderStatus.PENDING,
              note: 'Order created',
              createdBy: userId,
            },
          },
          // Create order items
          items: {
            create: orderItems,
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          shippingAddress: true,
          items: {
            include: {
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
          statusHistory: true,
        },
      });

      return newOrder;
    });

    return order as unknown as OrderWithDetails;
  }

  async createOrderFromQuote(
    userId: string,
    data: CreateOrderFromQuoteDto,
  ): Promise<OrderWithDetails> {
    try {
      // Get quote request
      const quoteRequest = await this.prisma.quoteRequest.findUnique({
        where: {
          id: data.quoteRequestId,
          customerId: userId,
          status: 'ACCEPTED', // Only accepted quotes can become orders
        },
        include: {
          product: {
            include: {
              seller: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!quoteRequest) {
        throw new AppError('Quote request not found or not accepted', 404, 'QUOTE_NOT_FOUND');
      }

      // Verify shipping address
      const address = await this.prisma.address.findFirst({
        where: {
          id: data.addressId,
          profile: {
            userId,
          },
        },
      });

      if (!address) {
        throw new AppError('Shipping address not found', 404, 'ADDRESS_NOT_FOUND');
      }

      // Ensure final price is set
      if (!quoteRequest.finalPrice) {
        throw new AppError('No final price set for this quote', 400, 'NO_FINAL_PRICE');
      }

      // Calculate order totals
      const subtotal = quoteRequest.finalPrice;

      // Prepare order item
      const orderItems = [
        {
          productId: quoteRequest.productId,
          sellerId: quoteRequest.product.sellerId,
          quantity: 1, // Quotes are for single items
          price: quoteRequest.finalPrice,
          productData: {
            id: quoteRequest.product.id,
            name: quoteRequest.product.name,
            description: quoteRequest.product.description,
            images: quoteRequest.product.images,
            attributes: quoteRequest.product.attributes,
            isCustomizable: true,
            customSpecifications: quoteRequest.specifications,
          },
        },
      ];

      // Generate unique order number
      const orderNumber = await this.generateOrderNumber();

      const order = await this.createOrderWithItems(userId, {
        orderNumber,
        addressId: data.addressId,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        orderItems,
        subtotal,
      });

      // Update quote request to COMPLETED status trong transaction khác
      await this.prisma.quoteRequest.update({
        where: { id: quoteRequest.id },
        data: { status: 'COMPLETED' },
      });

      return order;
    } catch (error) {
      this.logger.error(`Error creating order from quote: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create order from quote', 500, 'ORDER_CREATION_FAILED');
    }
  }

  /**
   * Cập nhật trạng thái đơn hàng
   */
  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    statusHistoryData: { note?: string; createdBy?: string },
  ): Promise<OrderWithDetails> {
    try {
      const { note, createdBy } = statusHistoryData;

      // Cập nhật đơn hàng và tạo lịch sử trạng thái
      const updatedOrder = await this.prisma.$transaction(async (tx) => {
        // Cập nhật trạng thái đơn hàng
        const updated = await tx.order.update({
          where: { id },
          data: {
            status,
            // Cập nhật trạng thái thanh toán nếu cần
            ...(status === OrderStatus.CANCELLED && {
              paymentStatus: PaymentStatus.REFUNDED,
            }),
          },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            shippingAddress: true,
            items: {
              include: {
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
            statusHistory: {
              orderBy: {
                createdAt: 'desc',
              },
            },
            quoteRequest: {
              select: {
                id: true,
                finalPrice: true,
                specifications: true,
              },
            },
          },
        });

        // Tạo mục lịch sử trạng thái
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status,
            note: note || `Order status changed to ${status}`,
            createdBy,
          },
        });

        return updated;
      });

      return updatedOrder as unknown as OrderWithDetails;
    } catch (error) {
      this.logger.error(`Error updating order status: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update order status', 500, 'STATUS_UPDATE_FAILED');
    }
  }

  /**
   * Update shipping information
   */
  async updateShippingInfo(id: string, data: UpdateShippingInfoDto): Promise<OrderWithDetails> {
    try {
      // Check if order exists
      const order = await this.prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
      }

      // Update shipping info
      const updatedOrder = await this.prisma.order.update({
        where: { id },
        data: {
          trackingNumber: data.trackingNumber,
          trackingUrl: data.trackingUrl,
          estimatedDelivery: data.estimatedDelivery,
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          shippingAddress: true,
          items: {
            include: {
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
          statusHistory: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          quoteRequest: {
            select: {
              id: true,
              finalPrice: true,
              specifications: true,
            },
          },
        },
      });

      // If tracking number added and status is PROCESSING, update to SHIPPED
      if (data.trackingNumber && order.status === OrderStatus.PROCESSING) {
        return await this.updateOrderStatus(id, {
          status: OrderStatus.SHIPPED,
          note: 'Tracking number added',
        });
      }

      return updatedOrder as unknown as OrderWithDetails;
    } catch (error) {
      this.logger.error(`Error updating shipping info: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update shipping information', 500, 'SHIPPING_UPDATE_FAILED');
    }
  }

  /**
   * Get orders with filtering and pagination
   */
  async getOrders(options: OrderQueryOptions): Promise<PaginatedResult<OrderSummary>> {
    try {
      const {
        userId,
        status,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeCancelled = false,
      } = options;

      // Build query conditions
      const where: Prisma.OrderWhereInput = {};

      if (userId) {
        where.userId = userId;
      }

      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      } else if (!includeCancelled) {
        // Exclude CANCELLED status by default
        where.status = { not: OrderStatus.CANCELLED };
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};

        if (dateFrom) {
          where.createdAt.gte = dateFrom;
        }

        if (dateTo) {
          where.createdAt.lte = dateTo;
        }
      }

      // Count total orders
      const total = await this.prisma.order.count({ where });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Build sorting
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get orders with pagination
      const orders = await this.prisma.order.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { items: true },
          },
          items: {
            take: 1, // Just need one to get seller info for summary
            select: {
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

      // Transform to OrderSummary format
      const orderSummaries = orders.map((order) => {
        let sellerInfo;

        if (order.items.length > 0) {
          const seller = order.items[0].seller;
          sellerInfo = {
            id: seller.id,
            name: `${seller.firstName} ${seller.lastName}`,
            shopName: seller.artisanProfile?.shopName,
          };
        }

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status as OrderStatus,
          totalAmount: Number(order.totalAmount),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          itemCount: order._count.items,
          sellerInfo,
        };
      });

      return {
        data: orderSummaries,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting orders: ${error}`);
      throw new AppError('Failed to get orders', 500, 'QUERY_FAILED');
    }
  }

  /**
   * Get artisan orders (orders containing items sold by the artisan)
   */
  async getArtisanOrders(
    artisanId: string,
    options: OrderQueryOptions,
  ): Promise<PaginatedResult<OrderSummary>> {
    try {
      const {
        status,
        dateFrom,
        dateTo,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeCancelled = false,
      } = options;

      // Build order item conditions to find orders containing artisan's items
      const orderItemWhere: Prisma.OrderItemWhereInput = {
        sellerId: artisanId,
      };

      // Build order conditions
      const where: Prisma.OrderWhereInput = {
        items: {
          some: orderItemWhere,
        },
      };

      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      } else if (!includeCancelled) {
        // Exclude CANCELLED status by default
        where.status = { not: OrderStatus.CANCELLED };
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};

        if (dateFrom) {
          where.createdAt.gte = dateFrom;
        }

        if (dateTo) {
          where.createdAt.lte = dateTo;
        }
      }

      // Count total matching orders
      const total = await this.prisma.order.count({ where });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Build sorting
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get orders with pagination
      const orders = await this.prisma.order.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          items: {
            where: {
              sellerId: artisanId,
            },
          },
        },
      });

      // Transform to OrderSummary format (with customer as the "seller" side)
      const orderSummaries = orders.map((order) => {
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status as OrderStatus,
          totalAmount: order.items.reduce(
            (sum, item) => sum + Number(item.price) * item.quantity,
            0,
          ),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          itemCount: order.items.length,
          customerInfo: {
            id: order.customer.id,
            name: `${order.customer.firstName} ${order.customer.lastName}`,
          },
        };
      });

      return {
        data: orderSummaries,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting artisan orders: ${error}`);
      throw new AppError('Failed to get artisan orders', 500, 'QUERY_FAILED');
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(id: string, note?: string, cancelledBy?: string): Promise<OrderWithDetails> {
    try {
      // Get order to check if it can be cancelled
      const order = await this.findByIdWithDetails(id);
      if (!order) {
        throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
      }

      // Only pending or paid orders can be cancelled
      if (
        order.status !== OrderStatus.PENDING &&
        order.status !== OrderStatus.PAID &&
        order.status !== OrderStatus.PROCESSING
      ) {
        throw new AppError(
          `Orders in ${order.status} status cannot be cancelled`,
          400,
          'INVALID_ORDER_STATE',
        );
      }

      // Process cancellation in a transaction
      const cancelledOrder = await this.prisma.$transaction(async (tx) => {
        // Get order items before updating
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: id },
        });

        // Update order status
        const updated = await tx.order.update({
          where: { id },
          data: {
            status: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.REFUNDED, // Assume refund process happens elsewhere
          },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            shippingAddress: true,
            items: {
              include: {
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
            statusHistory: {
              orderBy: {
                createdAt: 'desc',
              },
            },
            quoteRequest: {
              select: {
                id: true,
                finalPrice: true,
                specifications: true,
              },
            },
          },
        });

        // Create status history entry
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status: OrderStatus.CANCELLED,
            note: note || 'Order cancelled',
            createdBy: cancelledBy,
          },
        });

        // Restore product quantities
        for (const item of orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });
        }

        return updated;
      });

      return cancelledOrder as unknown as OrderWithDetails;
    } catch (error) {
      this.logger.error(`Error cancelling order: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cancel order', 500, 'CANCELLATION_FAILED');
    }
  }

  /**
   * Process payment
   */
  async processPayment(id: string, paymentIntentId: string): Promise<OrderWithDetails> {
    try {
      // Get order to validate
      const order = await this.prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new AppError(
          'Order must be in PENDING status to process payment',
          400,
          'INVALID_ORDER_STATE',
        );
      }

      // Update order with payment information
      const updatedOrder = await this.prisma.$transaction(async (tx) => {
        // Update order
        const updated = await tx.order.update({
          where: { id },
          data: {
            paymentIntentId,
            paymentStatus: PaymentStatus.COMPLETED,
          },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            shippingAddress: true,
            items: {
              include: {
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
            statusHistory: {
              orderBy: {
                createdAt: 'desc',
              },
            },
            quoteRequest: {
              select: {
                id: true,
                finalPrice: true,
                specifications: true,
              },
            },
          },
        });

        return updated;
      });

      // Update order status to PAID
      return await this.updateOrderStatus(id, {
        status: OrderStatus.PAID,
        note: 'Payment completed',
      });
    } catch (error) {
      this.logger.error(`Error processing payment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to process payment', 500, 'PAYMENT_PROCESSING_FAILED');
    }
  }

  /**
   * Get order status history
   */
  async getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    try {
      const statusHistory = await this.prisma.orderStatusHistory.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
        include: {
          createdByUser: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      return statusHistory as unknown as OrderStatusHistory[];
    } catch (error) {
      this.logger.error(`Error getting order status history: ${error}`);
      throw new AppError('Failed to get order status history', 500, 'QUERY_FAILED');
    }
  }

  /**
   * Generate unique order number
   */
  async generateOrderNumber(): Promise<string> {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear().toString().substr(2, 2); // Last 2 digits of year
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');

      // Get current order count for today to generate sequential number
      const todayStart = new Date(currentDate.setHours(0, 0, 0, 0));
      const todayEnd = new Date(currentDate.setHours(23, 59, 59, 999));

      const todayOrderCount = await this.prisma.order.count({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      // Create sequential number padded to 4 digits
      const sequence = String(todayOrderCount + 1).padStart(4, '0');

      // Generate order number in format: AC-YYMMDD-XXXX (AC for Artisan Connect)
      const orderNumber = `AC-${year}${month}${day}-${sequence}`;

      // Verify it's unique (just in case)
      const existing = await this.prisma.order.findUnique({
        where: { orderNumber },
      });

      if (existing) {
        // In the rare case of collision, recursively try again
        return this.generateOrderNumber();
      }

      return orderNumber;
    } catch (error) {
      this.logger.error(`Error generating order number: ${error}`);
      throw new AppError('Failed to generate order number', 500, 'GENERATION_FAILED');
    }
  }

  /**
   * Check if user is involved in order
   */
  async isUserInvolved(orderId: string, userId: string): Promise<boolean> {
    try {
      // Check if user is the customer
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true },
      });

      if (order?.userId === userId) {
        return true;
      }

      // Check if user is a seller of any item in the order
      const orderItem = await this.prisma.orderItem.findFirst({
        where: {
          orderId,
          sellerId: userId,
        },
      });

      return !!orderItem;
    } catch (error) {
      this.logger.error(`Error checking user involvement in order: ${error}`);
      return false;
    }
  }

  /**
   * Validate order status transition
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    // Define valid transitions for each status
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    // Check if transition is valid
    if (currentStatus === newStatus) {
      return; // Same status is always valid
    }

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        400,
        'INVALID_STATUS_TRANSITION',
      );
    }
  }
}
