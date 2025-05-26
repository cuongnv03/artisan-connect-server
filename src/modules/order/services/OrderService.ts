import { IOrderService } from './OrderService.interface';
import {
  Order,
  OrderWithDetails,
  OrderSummary,
  OrderStatusHistory,
  CreateOrderFromCartDto,
  CreateOrderFromQuoteDto,
  UpdateOrderStatusDto,
  ProcessPaymentDto,
  OrderQueryOptions,
  OrderStats,
} from '../models/Order';
import { OrderStatus } from '../models/OrderEnums';
import { IOrderRepository } from '../repositories/OrderRepository.interface';
import { ICartRepository } from '../../cart/repositories/CartRepository.interface';
import { IQuoteRepository } from '../../quote/repositories/QuoteRepository.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import container from '../../../core/di/container';

export class OrderService implements IOrderService {
  private orderRepository: IOrderRepository;
  private cartRepository: ICartRepository;
  private quoteRepository: IQuoteRepository;
  private userRepository: IUserRepository;
  private logger = Logger.getInstance();

  constructor() {
    this.orderRepository = container.resolve<IOrderRepository>('orderRepository');
    this.cartRepository = container.resolve<ICartRepository>('cartRepository');
    this.quoteRepository = container.resolve<IQuoteRepository>('quoteRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
  }

  async createOrderFromCart(
    userId: string,
    data: CreateOrderFromCartDto,
  ): Promise<OrderWithDetails> {
    try {
      // Validate user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Validate cart is not empty
      const cartValidation = await this.cartRepository.validateCartItems(userId);
      if (!cartValidation.isValid) {
        const errors = cartValidation.errors.map((e) => e.message).join(', ');
        throw new AppError(`Cart validation failed: ${errors}`, 400, 'INVALID_CART');
      }

      const order = await this.orderRepository.createOrderFromCart(userId, data);

      // Add null check
      if (!order) {
        throw new AppError('Failed to retrieve created order', 500, 'ORDER_RETRIEVAL_FAILED');
      }

      this.logger.info(
        `Order created from cart: ${order.id} (${order.orderNumber}) for user ${userId}`,
      );

      return order;
    } catch (error) {
      this.logger.error(`Error creating order from cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create order from cart', 500, 'SERVICE_ERROR');
    }
  }

  async createOrderFromQuote(
    userId: string,
    data: CreateOrderFromQuoteDto,
  ): Promise<OrderWithDetails> {
    try {
      // Validate user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Validate quote exists and belongs to user
      const quote = await this.quoteRepository.findById(data.quoteRequestId);
      if (!quote) {
        throw new AppError('Quote request not found', 404, 'QUOTE_NOT_FOUND');
      }

      if (quote.customerId !== userId) {
        throw new AppError('You can only create orders from your own quotes', 403, 'FORBIDDEN');
      }

      const order = await this.orderRepository.createOrderFromQuote(userId, data);

      this.logger.info(
        `Order created from quote: ${order.id} (${order.orderNumber}) for user ${userId}`,
      );

      return order;
    } catch (error) {
      this.logger.error(`Error creating order from quote: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create order from quote', 500, 'SERVICE_ERROR');
    }
  }

  async getOrderById(id: string): Promise<OrderWithDetails | null> {
    try {
      return await this.orderRepository.findByIdWithDetails(id);
    } catch (error) {
      this.logger.error(`Error getting order by ID: ${error}`);
      return null;
    }
  }

  async getOrderByNumber(orderNumber: string): Promise<OrderWithDetails | null> {
    try {
      return await this.orderRepository.findByOrderNumber(orderNumber);
    } catch (error) {
      this.logger.error(`Error getting order by number: ${error}`);
      return null;
    }
  }

  async getOrders(options: OrderQueryOptions = {}): Promise<PaginatedResult<OrderSummary>> {
    try {
      return await this.orderRepository.getOrders(options);
    } catch (error) {
      this.logger.error(`Error getting orders: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get orders', 500, 'SERVICE_ERROR');
    }
  }

  async getMyOrders(
    userId: string,
    options: Partial<OrderQueryOptions> = {},
  ): Promise<PaginatedResult<OrderSummary>> {
    try {
      return await this.orderRepository.getCustomerOrders(userId, options);
    } catch (error) {
      this.logger.error(`Error getting my orders: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get my orders', 500, 'SERVICE_ERROR');
    }
  }

  async getSellerOrders(
    sellerId: string,
    options: Partial<OrderQueryOptions> = {},
  ): Promise<PaginatedResult<OrderSummary>> {
    try {
      // Validate seller is artisan
      const seller = await this.userRepository.findById(sellerId);
      if (!seller || seller.role !== 'ARTISAN') {
        throw new AppError('User is not an artisan', 403, 'NOT_ARTISAN');
      }

      return await this.orderRepository.getSellerOrders(sellerId, options);
    } catch (error) {
      this.logger.error(`Error getting seller orders: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get seller orders', 500, 'SERVICE_ERROR');
    }
  }

  async updateOrderStatus(
    id: string,
    data: UpdateOrderStatusDto,
    updatedBy: string,
  ): Promise<OrderWithDetails> {
    try {
      // Validate order exists and user has permission
      const hasAccess = await this.validateOrderAccess(id, updatedBy, 'UPDATE');
      if (!hasAccess) {
        throw new AppError('You do not have permission to update this order', 403, 'FORBIDDEN');
      }

      // Additional business logic validation
      await this.validateStatusUpdate(id, data, updatedBy);

      const order = await this.orderRepository.updateOrderStatus(id, data, updatedBy);

      this.logger.info(`Order status updated: ${id} to ${data.status} by ${updatedBy}`);

      return order;
    } catch (error) {
      this.logger.error(`Error updating order status: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update order status', 500, 'SERVICE_ERROR');
    }
  }

  async cancelOrder(id: string, userId: string, reason?: string): Promise<OrderWithDetails> {
    try {
      // Validate order access
      const hasAccess = await this.validateOrderAccess(id, userId, 'CANCEL');
      if (!hasAccess) {
        throw new AppError('You do not have permission to cancel this order', 403, 'FORBIDDEN');
      }

      const order = await this.orderRepository.cancelOrder(id, reason, userId);

      this.logger.info(`Order cancelled: ${id} by ${userId}`);

      return order;
    } catch (error) {
      this.logger.error(`Error cancelling order: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cancel order', 500, 'SERVICE_ERROR');
    }
  }

  async processPayment(id: string, data: ProcessPaymentDto): Promise<OrderWithDetails> {
    try {
      // Get order to validate
      const order = await this.orderRepository.findByIdWithDetails(id);
      if (!order) {
        throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
      }

      // Basic payment validation
      if (order.paymentStatus === 'COMPLETED') {
        throw new AppError('Order is already paid', 400, 'ORDER_ALREADY_PAID');
      }

      const processedOrder = await this.orderRepository.processPayment(id, data);

      this.logger.info(`Payment processed for order: ${id}`);

      return processedOrder;
    } catch (error) {
      this.logger.error(`Error processing payment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to process payment', 500, 'SERVICE_ERROR');
    }
  }

  async refundPayment(id: string, reason?: string): Promise<OrderWithDetails> {
    try {
      const order = await this.orderRepository.refundPayment(id, reason);

      this.logger.info(`Payment refunded for order: ${id}`);

      return order;
    } catch (error) {
      this.logger.error(`Error refunding payment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to refund payment', 500, 'SERVICE_ERROR');
    }
  }

  async getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    try {
      return await this.orderRepository.getOrderStatusHistory(orderId);
    } catch (error) {
      this.logger.error(`Error getting order status history: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get order status history', 500, 'SERVICE_ERROR');
    }
  }

  async getOrderStats(userId?: string, sellerId?: string): Promise<OrderStats> {
    try {
      return await this.orderRepository.getOrderStats(userId, sellerId);
    } catch (error) {
      this.logger.error(`Error getting order stats: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get order stats', 500, 'SERVICE_ERROR');
    }
  }

  async validateOrderAccess(
    orderId: string,
    userId: string,
    action: string = 'VIEW',
  ): Promise<boolean> {
    try {
      // Get user role
      const user = await this.userRepository.findById(userId);
      if (!user) return false;

      // Admins can access everything
      if (user.role === 'ADMIN') return true;

      // Check if user is involved in the order
      const isInvolved = await this.orderRepository.isUserInvolvedInOrder(orderId, userId);
      if (!isInvolved) return false;

      // Additional permission checks based on action
      if (action === 'UPDATE' || action === 'CANCEL') {
        const order = await this.orderRepository.findByIdWithDetails(orderId);
        if (!order) return false;

        // Only customer can cancel their orders
        if (action === 'CANCEL' && order.customer.id !== userId) {
          return false;
        }

        // Only sellers can update order status (except cancellation)
        if (action === 'UPDATE' && order.customer.id === userId) {
          // Customers can only cancel
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Error validating order access: ${error}`);
      return false;
    }
  }

  private async validateStatusUpdate(
    orderId: string,
    data: UpdateOrderStatusDto,
    updatedBy: string,
  ): Promise<void> {
    const order = await this.orderRepository.findByIdWithDetails(orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    const user = await this.userRepository.findById(updatedBy);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Role-based status update validation
    switch (user.role) {
      case 'ADMIN':
        // Admins can update to any status
        break;

      case 'ARTISAN':
        // Artisans can only update orders where they are sellers
        const isSeller = order.items.some((item) => item.seller.id === updatedBy);
        if (!isSeller) {
          throw new AppError('You can only update orders for your products', 403, 'FORBIDDEN');
        }

        // Artisans can mark as processing, shipped, or delivered
        const allowedStatuses = [
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
        ];
        if (!allowedStatuses.includes(data.status)) {
          throw new AppError(
            'Artisans can only update orders to processing, shipped, or delivered',
            403,
            'FORBIDDEN_STATUS',
          );
        }
        break;

      case 'CUSTOMER':
        // Customers can only cancel their own orders
        if (order.customer.id !== updatedBy) {
          throw new AppError('You can only update your own orders', 403, 'FORBIDDEN');
        }

        if (data.status !== OrderStatus.CANCELLED) {
          throw new AppError('Customers can only cancel orders', 403, 'FORBIDDEN_STATUS');
        }
        break;

      default:
        throw new AppError('Unauthorized role', 403, 'FORBIDDEN');
    }
  }
}
