import { CustomOrderRepository } from './../../custom-order/repositories/CustomOrderRepository';
import { IOrderService } from './OrderService.interface';
import {
  Order,
  OrderWithDetails,
  OrderSummary,
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
import { OrderStatus, DisputeStatus, ReturnStatus } from '../models/OrderEnums';
import { IOrderRepository } from '../repositories/OrderRepository.interface';
import { ICartRepository } from '../../cart/repositories/CartRepository.interface';
import { ICustomOrderRepository } from '../../custom-order/repositories/CustomOrderRepository.interface';
import { IUserRepository } from '../../auth/repositories/UserRepository.interface';
import { INotificationService } from '../../notification';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import container from '../../../core/di/container';

export class OrderService implements IOrderService {
  private orderRepository: IOrderRepository;
  private cartRepository: ICartRepository;
  private customOrderRepository: ICustomOrderRepository;
  private userRepository: IUserRepository;
  private notificationService: INotificationService;
  private logger = Logger.getInstance();

  constructor() {
    this.orderRepository = container.resolve<IOrderRepository>('orderRepository');
    this.cartRepository = container.resolve<ICartRepository>('cartRepository');
    this.customOrderRepository = container.resolve<ICustomOrderRepository>('customOrderRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
    this.notificationService = container.resolve<INotificationService>('notificationService');
  }

  // ORDER CREATION METHODS
  async createOrderFromCart(
    userId: string,
    data: CreateOrderFromCartDto,
  ): Promise<OrderWithDetails> {
    try {
      // Validate user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      // Validate cart is not empty and valid
      const cartValidation = await this.cartRepository.validateCartItems(userId);
      if (!cartValidation.isValid) {
        const errors = cartValidation.errors.map((e) => e.message).join(', ');
        throw AppError.badRequest(`Cart validation failed: ${errors}`, 'INVALID_CART');
      }

      // Create order
      const order = await this.orderRepository.createOrderFromCart(userId, data);

      // Send notifications to sellers
      try {
        await this.notifyOrderCreated(order);
      } catch (notifError) {
        this.logger.error(`Error sending order notifications: ${notifError}`);
        // Don't fail order creation if notification fails
      }

      this.logger.info(
        `Order created from cart: ${order.id} (${order.orderNumber}) for user ${userId}`,
      );

      return order;
    } catch (error) {
      this.logger.error(`Error creating order from cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to create order from cart', 'SERVICE_ERROR');
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
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      // Validate quote exists and belongs to user
      const quote = await this.customOrderRepository.findById(data.quoteRequestId);
      if (!quote) {
        throw AppError.notFound('Quote request not found', 'QUOTE_NOT_FOUND');
      }

      if (quote.customerId !== userId) {
        throw AppError.forbidden('You can only create orders from your own quotes', 'FORBIDDEN');
      }

      if (quote.status !== 'ACCEPTED') {
        throw AppError.badRequest(
          'Only accepted quotes can be converted to orders',
          'INVALID_QUOTE_STATUS',
        );
      }

      // Create order through repository
      const order = await this.orderRepository.createOrderFromQuote(userId, data);

      // ✅ CRITICAL: Validate order creation success
      if (!order) {
        throw AppError.internal('Order creation returned null', 'ORDER_CREATION_NULL');
      }

      if (!order.id) {
        throw AppError.internal('Order creation returned invalid data', 'ORDER_INVALID_DATA');
      }

      // ✅ DEFENSIVE: Validate order has required data for notifications
      if (!order.customer) {
        this.logger.error(`Created order ${order.id} missing customer data`);
        throw AppError.internal('Order missing customer data', 'ORDER_MISSING_CUSTOMER');
      }

      // Send notifications asynchronously with error handling
      setImmediate(async () => {
        try {
          await this.notifyOrderCreated(order);
          this.logger.info(`Order notifications sent successfully for order ${order.id}`);
        } catch (notifError) {
          // ✅ CRITICAL: Log but don't fail the order creation
          this.logger.error(`Error sending order notifications for ${order.id}: ${notifError}`);

          // Optional: Create a system notification about the failure
          try {
            await this.notificationService.sendNotification({
              recipientId: userId,
              type: 'SYSTEM',
              title: 'Order Created Successfully',
              message: `Your order ${order.orderNumber} has been created successfully.`,
              actionUrl: `/orders/${order.id}`,
            });
          } catch (systemNotifError) {
            this.logger.error(`Failed to send system notification: ${systemNotifError}`);
          }
        }
      });

      this.logger.info(
        `Order created from quote: ${order.id} (${order.orderNumber}) for user ${userId}`,
      );

      return order;
    } catch (error) {
      this.logger.error(`Error creating order from quote: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to create order from quote', 'SERVICE_ERROR');
    }
  }

  // ORDER RETRIEVAL METHODS
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
      throw AppError.internal('Failed to get orders', 'SERVICE_ERROR');
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
      throw AppError.internal('Failed to get my orders', 'SERVICE_ERROR');
    }
  }

  async getArtisanOrders(
    sellerId: string,
    options: Partial<OrderQueryOptions> = {},
  ): Promise<PaginatedResult<OrderSummary>> {
    try {
      // Validate seller is artisan
      const seller = await this.userRepository.findById(sellerId);
      if (!seller || seller.role !== 'ARTISAN') {
        throw AppError.forbidden('User is not an artisan', 'NOT_ARTISAN');
      }

      return await this.orderRepository.getSellerOrders(sellerId, options);
    } catch (error) {
      this.logger.error(`Error getting artisan orders: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get artisan orders', 'SERVICE_ERROR');
    }
  }

  // ORDER MANAGEMENT METHODS
  async updateOrderStatus(
    id: string,
    data: UpdateOrderStatusDto,
    updatedBy: string,
  ): Promise<OrderWithDetails> {
    try {
      // Validate order exists and user has permission
      const hasAccess = await this.validateOrderAccess(id, updatedBy, 'UPDATE');
      if (!hasAccess) {
        throw AppError.forbidden('You do not have permission to update this order', 'FORBIDDEN');
      }

      // Additional business logic validation
      await this.validateStatusUpdate(id, data, updatedBy);

      // Update order status
      const order = await this.orderRepository.updateOrderStatus(id, data, updatedBy);

      // Send notifications
      try {
        await this.notifyOrderStatusChanged(order, data.status);
      } catch (notifError) {
        this.logger.error(`Error sending status change notifications: ${notifError}`);
      }

      this.logger.info(`Order status updated: ${id} to ${data.status} by ${updatedBy}`);

      return order;
    } catch (error) {
      this.logger.error(`Error updating order status: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update order status', 'SERVICE_ERROR');
    }
  }

  async cancelOrder(id: string, userId: string, reason?: string): Promise<OrderWithDetails> {
    try {
      // Validate order access
      const hasAccess = await this.validateOrderAccess(id, userId, 'CANCEL');
      if (!hasAccess) {
        throw AppError.forbidden('You do not have permission to cancel this order', 'FORBIDDEN');
      }

      // Additional validation for cancellation
      const order = await this.orderRepository.findByIdWithDetails(id);
      if (!order) {
        throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
      }

      // Business rules for cancellation
      const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PAID];
      if (!cancellableStatuses.includes(order.status)) {
        throw AppError.badRequest(`Cannot cancel order in ${order.status} status`, 'CANNOT_CANCEL');
      }

      // Cancel order
      const cancelledOrder = await this.orderRepository.cancelOrder(id, reason, userId);

      // Send notifications
      try {
        await this.notifyOrderCancelled(cancelledOrder, reason);
      } catch (notifError) {
        this.logger.error(`Error sending cancellation notifications: ${notifError}`);
      }

      this.logger.info(`Order cancelled: ${id} by ${userId}`);

      return cancelledOrder;
    } catch (error) {
      this.logger.error(`Error cancelling order: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to cancel order', 'SERVICE_ERROR');
    }
  }

  // PAYMENT METHODS
  async processPayment(id: string, data: ProcessPaymentDto): Promise<OrderWithDetails> {
    try {
      // Get order to validate
      const order = await this.orderRepository.findByIdWithDetails(id);
      if (!order) {
        throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
      }

      // Basic payment validation
      if (order.paymentStatus === 'COMPLETED') {
        throw AppError.badRequest('Order is already paid', 'ORDER_ALREADY_PAID');
      }

      // Process payment
      const processedOrder = await this.orderRepository.processPayment(id, data);

      // Send notifications
      try {
        await this.notifyPaymentProcessed(processedOrder);
      } catch (notifError) {
        this.logger.error(`Error sending payment notifications: ${notifError}`);
      }

      this.logger.info(`Payment processed for order: ${id}`);

      return processedOrder;
    } catch (error) {
      this.logger.error(`Error processing payment: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to process payment', 'SERVICE_ERROR');
    }
  }

  async refundPayment(id: string, reason?: string): Promise<OrderWithDetails> {
    try {
      const order = await this.orderRepository.refundPayment(id, reason);

      // Send notifications
      try {
        await this.notifyPaymentRefunded(order, reason);
      } catch (notifError) {
        this.logger.error(`Error sending refund notifications: ${notifError}`);
      }

      this.logger.info(`Payment refunded for order: ${id}`);

      return order;
    } catch (error) {
      this.logger.error(`Error refunding payment: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to refund payment', 'SERVICE_ERROR');
    }
  }

  // STATUS HISTORY
  async getOrderStatusHistory(orderId: string): Promise<any[]> {
    try {
      return await this.orderRepository.getStatusHistory(orderId);
    } catch (error) {
      this.logger.error(`Error getting order status history: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get order status history', 'SERVICE_ERROR');
    }
  }

  // ANALYTICS
  async getOrderStats(userId?: string, sellerId?: string): Promise<OrderStats> {
    try {
      return await this.orderRepository.getOrderStats(userId, sellerId);
    } catch (error) {
      this.logger.error(`Error getting order stats: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get order stats', 'SERVICE_ERROR');
    }
  }

  // VALIDATION METHODS
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

  // DISPUTE METHODS
  async createDispute(userId: string, data: CreateDisputeDto): Promise<OrderDisputeWithDetails> {
    try {
      // Validate user can create dispute
      const canCreate = await this.orderRepository.canUserCreateDispute(data.orderId, userId);
      if (!canCreate) {
        throw AppError.badRequest(
          'You cannot create a dispute for this order',
          'CANNOT_CREATE_DISPUTE',
        );
      }

      // Create dispute
      const dispute = await this.orderRepository.createDispute({
        ...data,
        complainantId: userId,
      });

      // Send notifications
      try {
        await this.notifyDisputeCreated(dispute);
      } catch (notifError) {
        this.logger.error(`Error sending dispute notifications: ${notifError}`);
      }

      this.logger.info(
        `Dispute created: ${dispute.id} for order ${data.orderId} by user ${userId}`,
      );

      return dispute;
    } catch (error) {
      this.logger.error(`Error creating dispute: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to create dispute', 'SERVICE_ERROR');
    }
  }

  async updateDispute(
    id: string,
    data: UpdateDisputeDto,
    updatedBy: string,
  ): Promise<OrderDisputeWithDetails> {
    try {
      // Validate access
      const hasAccess = await this.validateDisputeAccess(id, updatedBy);
      if (!hasAccess) {
        throw AppError.forbidden('You do not have permission to update this dispute', 'FORBIDDEN');
      }

      // Validate status transition
      const currentDispute = await this.orderRepository.getDisputeById(id);
      if (!currentDispute) {
        throw AppError.notFound('Dispute not found', 'DISPUTE_NOT_FOUND');
      }

      await this.validateDisputeStatusUpdate(currentDispute, data, updatedBy);

      // Update dispute
      const dispute = await this.orderRepository.updateDispute(id, data, updatedBy);

      // Send notifications
      try {
        await this.notifyDisputeUpdated(dispute);
      } catch (notifError) {
        this.logger.error(`Error sending dispute update notifications: ${notifError}`);
      }

      this.logger.info(`Dispute updated: ${id} to ${data.status} by ${updatedBy}`);

      return dispute;
    } catch (error) {
      this.logger.error(`Error updating dispute: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update dispute', 'SERVICE_ERROR');
    }
  }

  async getMyDisputes(
    userId: string,
    options: Partial<DisputeQueryOptions> = {},
  ): Promise<PaginatedResult<OrderDisputeWithDetails>> {
    try {
      return await this.orderRepository.getUserDisputes(userId, options);
    } catch (error) {
      this.logger.error(`Error getting my disputes: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get my disputes', 'SERVICE_ERROR');
    }
  }

  async getDisputeById(id: string): Promise<OrderDisputeWithDetails | null> {
    try {
      return await this.orderRepository.getDisputeById(id);
    } catch (error) {
      this.logger.error(`Error getting dispute by ID: ${error}`);
      return null;
    }
  }

  async validateDisputeAccess(disputeId: string, userId: string): Promise<boolean> {
    try {
      // Get user role
      const user = await this.userRepository.findById(userId);
      if (!user) return false;

      // Admins can access everything
      if (user.role === 'ADMIN') return true;

      // Check specific access
      return await this.orderRepository.canUserAccessDispute(disputeId, userId);
    } catch (error) {
      this.logger.error(`Error validating dispute access: ${error}`);
      return false;
    }
  }

  // RETURN METHODS
  async createReturn(userId: string, data: CreateReturnDto): Promise<OrderReturnWithDetails> {
    try {
      // Validate user can create return
      const canCreate = await this.orderRepository.canUserCreateReturn(data.orderId, userId);
      if (!canCreate) {
        throw AppError.badRequest(
          'You cannot create a return for this order',
          'CANNOT_CREATE_RETURN',
        );
      }

      // Create return
      const returnRequest = await this.orderRepository.createReturn({
        ...data,
        requesterId: userId,
      });

      // Send notifications
      try {
        await this.notifyReturnCreated(returnRequest);
      } catch (notifError) {
        this.logger.error(`Error sending return notifications: ${notifError}`);
      }

      this.logger.info(
        `Return created: ${returnRequest.id} for order ${data.orderId} by user ${userId}`,
      );

      return returnRequest;
    } catch (error) {
      this.logger.error(`Error creating return: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to create return', 'SERVICE_ERROR');
    }
  }

  async updateReturn(
    id: string,
    data: UpdateReturnDto,
    updatedBy: string,
  ): Promise<OrderReturnWithDetails> {
    try {
      // Validate access
      const hasAccess = await this.validateReturnAccess(id, updatedBy);
      if (!hasAccess) {
        throw AppError.forbidden('You do not have permission to update this return', 'FORBIDDEN');
      }

      // Validate status transition
      const currentReturn = await this.orderRepository.getReturnById(id);
      if (!currentReturn) {
        throw AppError.notFound('Return not found', 'RETURN_NOT_FOUND');
      }

      await this.validateReturnStatusUpdate(currentReturn, data, updatedBy);

      // Update return
      const returnRequest = await this.orderRepository.updateReturn(id, data, updatedBy);

      // Send notifications
      try {
        await this.notifyReturnUpdated(returnRequest);
      } catch (notifError) {
        this.logger.error(`Error sending return update notifications: ${notifError}`);
      }

      this.logger.info(`Return updated: ${id} to ${data.status} by ${updatedBy}`);

      return returnRequest;
    } catch (error) {
      this.logger.error(`Error updating return: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update return', 'SERVICE_ERROR');
    }
  }

  async getMyReturns(
    userId: string,
    options: Partial<ReturnQueryOptions> = {},
  ): Promise<PaginatedResult<OrderReturnWithDetails>> {
    try {
      return await this.orderRepository.getUserReturns(userId, options);
    } catch (error) {
      this.logger.error(`Error getting my returns: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get my returns', 'SERVICE_ERROR');
    }
  }

  async getReturnById(id: string): Promise<OrderReturnWithDetails | null> {
    try {
      return await this.orderRepository.getReturnById(id);
    } catch (error) {
      this.logger.error(`Error getting return by ID: ${error}`);
      return null;
    }
  }

  async validateReturnAccess(returnId: string, userId: string): Promise<boolean> {
    try {
      // Get user role
      const user = await this.userRepository.findById(userId);
      if (!user) return false;

      // Admins can access everything
      if (user.role === 'ADMIN') return true;

      // Check specific access
      return await this.orderRepository.canUserAccessReturn(returnId, userId);
    } catch (error) {
      this.logger.error(`Error validating return access: ${error}`);
      return false;
    }
  }

  // PRIVATE HELPER METHODS
  private async validateStatusUpdate(
    orderId: string,
    data: UpdateOrderStatusDto,
    updatedBy: string,
  ): Promise<void> {
    const order = await this.orderRepository.findByIdWithDetails(orderId);
    if (!order) {
      throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    const user = await this.userRepository.findById(updatedBy);
    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
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
          throw AppError.forbidden('You can only update orders for your products', 'FORBIDDEN');
        }

        const allowedStatuses = [
          OrderStatus.CONFIRMED,
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
          OrderStatus.CANCELLED,
        ];

        if (!allowedStatuses.includes(data.status)) {
          throw AppError.forbidden(
            'Artisans can only update orders to confirmed, processing, shipped, delivered, or cancelled',
            'FORBIDDEN_STATUS',
          );
        }
        break;

      case 'CUSTOMER':
        // Customers can only cancel their own orders
        if (order.customer.id !== updatedBy) {
          throw AppError.forbidden('You can only update your own orders', 'FORBIDDEN');
        }

        if (data.status !== OrderStatus.CANCELLED) {
          throw AppError.forbidden('Customers can only cancel orders', 'FORBIDDEN_STATUS');
        }
        break;

      default:
        throw AppError.forbidden('Unauthorized role', 'FORBIDDEN');
    }
  }

  private async validateDisputeStatusUpdate(
    dispute: OrderDisputeWithDetails,
    data: UpdateDisputeDto,
    updatedBy: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(updatedBy);
    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    // Only admins and sellers can update dispute status
    if (user.role === 'ADMIN') {
      // Admins can update to any status
      return;
    }

    if (user.role === 'ARTISAN') {
      // Only sellers involved in the dispute can update
      const order = await this.orderRepository.findByIdWithDetails(dispute.orderId);
      if (!order) {
        throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
      }

      const isSeller = order.items.some((item) => item.seller.id === updatedBy);
      if (!isSeller) {
        throw AppError.forbidden('You can only update disputes for your orders', 'FORBIDDEN');
      }

      // Sellers can only respond, not resolve
      if (data.status === DisputeStatus.RESOLVED || data.status === DisputeStatus.CLOSED) {
        throw AppError.forbidden('Only admins can resolve disputes', 'FORBIDDEN_STATUS');
      }
    } else {
      throw AppError.forbidden('Only admins and sellers can update disputes', 'FORBIDDEN');
    }
  }

  private async validateReturnStatusUpdate(
    returnRequest: OrderReturnWithDetails,
    data: UpdateReturnDto,
    updatedBy: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(updatedBy);
    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    // Only admins and sellers can update return status
    if (user.role === 'ADMIN') {
      // Admins can update to any status
      return;
    }

    if (user.role === 'ARTISAN') {
      // Only sellers involved in the return can update
      const order = await this.orderRepository.findByIdWithDetails(returnRequest.orderId);
      if (!order) {
        throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
      }

      const isSeller = order.items.some((item) => item.seller.id === updatedBy);
      if (!isSeller) {
        throw AppError.forbidden('You can only update returns for your orders', 'FORBIDDEN');
      }

      // Sellers can approve/reject, admins handle refunds
      const allowedStatuses = [ReturnStatus.APPROVED, ReturnStatus.REJECTED];
      if (!allowedStatuses.includes(data.status)) {
        throw AppError.forbidden('Sellers can only approve or reject returns', 'FORBIDDEN_STATUS');
      }
    } else {
      throw AppError.forbidden('Only admins and sellers can update returns', 'FORBIDDEN');
    }
  }

  // NOTIFICATION METHODS
  private async notifyOrderCreated(order: OrderWithDetails): Promise<void> {
    // Validate order data before sending notifications
    if (!order?.customer?.id) {
      throw new Error('Order missing customer information');
    }

    if (!order.items || order.items.length === 0) {
      throw new Error('Order missing items information');
    }

    try {
      // Notify customer
      await this.notificationService.notifyOrderCreated(order.customer.id, order.id);

      // Notify all unique sellers
      const sellerIds = [...new Set(order.items.map((item) => item.seller?.id).filter(Boolean))];

      if (sellerIds.length === 0) {
        this.logger.warn(`Order ${order.id} has no valid seller IDs`);
        return;
      }

      // Send notifications to each seller
      const notificationPromises = sellerIds.map(async (sellerId) => {
        try {
          await this.notificationService.notifyNewOrderForSeller(sellerId, order.id);
          this.logger.debug(`Notification sent to seller ${sellerId} for order ${order.id}`);
        } catch (sellerNotifError) {
          this.logger.error(
            `Failed to notify seller ${sellerId} for order ${order.id}: ${sellerNotifError}`,
          );
          // Continue with other notifications
        }
      });

      await Promise.allSettled(notificationPromises);
    } catch (error) {
      this.logger.error(`Error in notifyOrderCreated for order ${order.id}: ${error}`);
      throw error;
    }
  }

  private async notifyOrderStatusChanged(
    order: OrderWithDetails,
    newStatus: OrderStatus,
  ): Promise<void> {
    await this.notificationService.notifyOrderStatusChanged(order.customer.id, order.id, newStatus);
  }

  private async notifyOrderCancelled(order: OrderWithDetails, reason?: string): Promise<void> {
    // Notify customer
    await this.notificationService.notifyOrderCancelled(order.customer.id, order.id);

    // Notify sellers
    const sellerIds = [...new Set(order.items.map((item) => item.seller.id))];
    for (const sellerId of sellerIds) {
      await this.notificationService.notifyOrderCancelledForSeller(sellerId, order.id);
    }
  }

  private async notifyPaymentProcessed(order: OrderWithDetails): Promise<void> {
    await this.notificationService.notifyPaymentSuccess(order.customer.id, order.id);
  }

  private async notifyPaymentRefunded(order: OrderWithDetails, reason?: string): Promise<void> {
    await this.notificationService.notifyPaymentRefunded(order.customer.id, order.id);
  }

  private async notifyDisputeCreated(dispute: OrderDisputeWithDetails): Promise<void> {
    // Notify admin
    await this.notificationService.notifyDisputeCreated(dispute.complainant.id, dispute.id);
  }

  private async notifyDisputeUpdated(dispute: OrderDisputeWithDetails): Promise<void> {
    await this.notificationService.notifyDisputeUpdated(dispute.complainant.id, dispute.id);
  }

  private async notifyReturnCreated(returnRequest: OrderReturnWithDetails): Promise<void> {
    // Get order to notify seller
    const order = await this.orderRepository.findByIdWithDetails(returnRequest.orderId);
    if (order) {
      const sellerIds = [...new Set(order.items.map((item) => item.seller.id))];
      for (const sellerId of sellerIds) {
        await this.notificationService.notifyReturnCreated(sellerId, returnRequest.id);
      }
    }
  }

  private async notifyReturnUpdated(returnRequest: OrderReturnWithDetails): Promise<void> {
    await this.notificationService.notifyReturnUpdated(
      returnRequest.requester.id,
      returnRequest.id,
    );
  }
}
