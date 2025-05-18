import { IOrderService } from './OrderService.interface';
import { ICartService } from '../../cart/services/CartService.interface';
import { IQuoteService } from '../../quote/services/QuoteService.interface';
import {
  Order,
  OrderWithDetails,
  OrderSummary,
  OrderQueryOptions,
  CreateOrderFromCartDto,
  CreateOrderFromQuoteDto,
  UpdateOrderStatusDto,
  UpdateShippingInfoDto,
  ConvertToOrderDto,
} from '../models/Order';
import { OrderStatus, PaymentMethod } from '../models/OrderEnums';
import { OrderStatusHistory } from '../models/OrderStatusHistory';
import { CartItem } from '../../cart/models/CartItem';
import { QuoteStatus } from '../../../modules/quote';
import { IOrderRepository } from '../repositories/OrderRepository.interface';
import { IUserRepository } from '../../user/repositories/UserRepository.interface';
import { IAddressRepository } from '../../profile/repositories/AddressRepository.interface';
import { IQuoteRepository } from '../../quote/repositories/QuoteRepository.interface';
import { IProductRepository } from '../../product/repositories/ProductRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import container from '../../../core/di/container';

export class OrderService implements IOrderService {
  private orderRepository: IOrderRepository;
  private userRepository: IUserRepository;
  private addressRepository: IAddressRepository;
  private quoteRepository: IQuoteRepository;
  private productRepository: IProductRepository;
  private cartService: ICartService;
  private quoteService: IQuoteService;
  private logger = Logger.getInstance();

  constructor() {
    this.orderRepository = container.resolve<IOrderRepository>('orderRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
    this.addressRepository = container.resolve<IAddressRepository>('addressRepository');
    this.quoteRepository = container.resolve<IQuoteRepository>('quoteRepository');
    this.productRepository = container.resolve<IProductRepository>('productRepository');
    this.cartService = container.resolve<ICartService>('cartService');
    this.quoteService = container.resolve<IQuoteService>('quoteService');
  }

  /**
   * Create order from cart
   */
  async createOrderFromCart(
    userId: string,
    data: CreateOrderFromCartDto,
  ): Promise<OrderWithDetails> {
    try {
      // 1. Validate user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // 2. Validate address
      await this.validateShippingAddress(userId, data.addressId);

      // 3. Validate cart before creating order
      const cartValidation = await this.cartService.validateCartForCheckout(userId);
      if (!cartValidation.valid) {
        throw new AppError(cartValidation.message || 'Cart validation failed', 400, 'INVALID_CART');
      }

      // 4. Get cart items
      const cartItems = await this.cartService.getCartItems(userId);

      // 5. Prepare order items
      const { orderItems, subtotal } = await this.prepareOrderItemsFromCart(cartItems);

      // 6. Generate order number
      const orderNumber = await this.generateOrderNumber();

      // 7. Create the order
      const order = await this.orderRepository.createOrderWithItems(userId, {
        orderNumber,
        addressId: data.addressId,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        orderItems,
        subtotal,
      });

      // 8. Update product stock for each item
      for (const item of order.items) {
        await this.productRepository.decrementStock(item.productId, item.quantity);
      }

      // 9. Clear the cart after successful order creation
      await this.cartService.clearCart(userId);

      // Log order creation
      this.logger.info(
        `Order created from cart: ${order.id} (${order.orderNumber}) by user ${userId} with ${order.items.length} items, total: ${order.totalAmount}`,
      );

      return order;
    } catch (error) {
      this.logger.error(`Error creating order from cart: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create order', 500, 'ORDER_CREATION_FAILED');
    }
  }

  /**
   * Prepare order items from cart items
   */
  private async prepareOrderItemsFromCart(cartItems: CartItem[]): Promise<{
    orderItems: any[];
    subtotal: number;
  }> {
    // Business logic to convert cart items to order items
    const orderItems: any[] = [];
    let subtotal = 0;

    for (const item of cartItems) {
      const product = item.product;
      if (!product) continue;

      // Calculate price for each item
      const price = product.discountPrice ?? product.price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      // Prepare product data for snapshot
      const productSnapshot = {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        isCustomizable: product.isCustomizable,
      };

      // Add to order items list
      orderItems.push({
        productId: product.id,
        sellerId: product.seller?.id || '',
        quantity: item.quantity,
        price,
        productData: productSnapshot,
      });
    }

    return { orderItems, subtotal };
  }

  /**
   * Validate shipping address
   */
  private async validateShippingAddress(userId: string, addressId: string): Promise<void> {
    // Logic to validate shipping address
    const address = await this.addressRepository.findById(addressId);

    if (!address) {
      throw AppError.notFound('Shipping address not found');
    }

    if (address.profileId !== userId) {
      throw AppError.forbidden('You cannot use this shipping address');
    }
  }

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD-${year}${month}${day}-${random}`;
  }

  /**
   * Create order from quote request
   */
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

      // Validate quote request
      const quote = await this.quoteRepository.findByIdWithDetails(data.quoteRequestId);
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
          'INVALID_QUOTE_STATE',
        );
      }

      // Create order from quote
      const order = await this.orderRepository.createOrderFromQuote(userId, data);

      // Update quote status after successful order creation
      await this.quoteService.updateQuoteStatus(data.quoteRequestId, QuoteStatus.COMPLETED);

      // Log order creation from quote
      this.logger.info(
        `Order created from quote: ${order.id} (${order.orderNumber}) by user ${userId}, quoteId: ${data.quoteRequestId}`,
      );

      return order;
    } catch (error) {
      this.logger.error(`Error creating order from quote: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create order', 500, 'ORDER_CREATION_FAILED');
    }
  }

  /**
   * Convert accepted quote to order
   */
  async convertQuoteToOrder(
    userId: string,
    quoteId: string,
    data: ConvertToOrderDto,
  ): Promise<OrderWithDetails> {
    try {
      // Validate user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Validate quote using QuoteService
      const quote = await this.quoteService.getQuoteRequestById(quoteId);

      if (!quote) {
        throw new AppError('Quote request not found', 404, 'QUOTE_NOT_FOUND');
      }

      // Verify the user is the customer for this quote
      if (quote.customerId !== userId) {
        throw new AppError(
          'Only the customer can convert this quote to an order',
          403,
          'FORBIDDEN',
        );
      }

      // Verify quote is in ACCEPTED status
      if (quote.status !== 'ACCEPTED') {
        throw new AppError(
          'Only accepted quotes can be converted to orders',
          400,
          'INVALID_QUOTE_STATE',
        );
      }

      // Verify final price is set
      if (!quote.finalPrice) {
        throw new AppError('No final price has been set for this quote', 400, 'NO_FINAL_PRICE');
      }

      // Create order from quote
      const order = await this.createOrderFromQuote(userId, {
        quoteRequestId: quoteId,
        addressId: data.shippingAddressId,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      });

      // Mark quote as COMPLETED via QuoteService
      await this.quoteService.updateQuoteStatus(quoteId, QuoteStatus.COMPLETED);

      // Log the conversion
      this.logger.info(
        `Quote ${quoteId} converted to order ${order.id} (${order.orderNumber}) by user ${userId}`,
      );

      return order;
    } catch (error) {
      this.logger.error(`Error converting quote to order: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to convert quote to order', 500, 'ORDER_CREATION_FAILED');
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<OrderWithDetails | null> {
    try {
      return await this.orderRepository.findByIdWithDetails(id);
    } catch (error) {
      this.logger.error(`Error getting order: ${error}`);
      return null;
    }
  }

  /**
   * Get order by order number
   */
  async getOrderByOrderNumber(orderNumber: string): Promise<OrderWithDetails | null> {
    try {
      return await this.orderRepository.findByOrderNumber(orderNumber);
    } catch (error) {
      this.logger.error(`Error getting order by order number: ${error}`);
      return null;
    }
  }

  /**
   * Get customer orders
   */
  async getCustomerOrders(
    userId: string,
    options: Partial<OrderQueryOptions> = {},
  ): Promise<PaginatedResult<OrderSummary>> {
    try {
      return await this.orderRepository.getOrders({
        userId,
        ...options,
      });
    } catch (error) {
      this.logger.error(`Error getting customer orders: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get customer orders', 500, 'QUERY_FAILED');
    }
  }

  /**
   * Get artisan orders
   */
  async getArtisanOrders(
    artisanId: string,
    options: Partial<OrderQueryOptions> = {},
  ): Promise<PaginatedResult<OrderSummary>> {
    try {
      // Validate user is an artisan
      const user = await this.userRepository.findById(artisanId);
      if (!user || user.role !== 'ARTISAN') {
        throw new AppError('User is not an artisan', 403, 'NOT_ARTISAN');
      }

      return await this.orderRepository.getArtisanOrders(artisanId, options);
    } catch (error) {
      this.logger.error(`Error getting artisan orders: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get artisan orders', 500, 'QUERY_FAILED');
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    id: string,
    data: UpdateOrderStatusDto,
    updatedBy: string,
  ): Promise<OrderWithDetails> {
    try {
      // Get order to check permissions
      const order = await this.orderRepository.findByIdWithDetails(id);
      if (!order) {
        throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
      }

      // Check if user is involved in the order
      const isInvolved = await this.orderRepository.isUserInvolved(id, updatedBy);
      if (!isInvolved) {
        throw new AppError('You do not have permission to update this order', 403, 'FORBIDDEN');
      }

      // Additional validations based on role and status
      await this.validateStatusUpdate(order, data.status, updatedBy);

      // Update order status
      const updatedOrder = await this.orderRepository.updateOrderStatus(id, data.status, {
        note: data.note,
        createdBy: updatedBy,
      });

      // Log status change
      this.logger.info(
        `Order ${id} (${order.orderNumber}) status changed from ${order.status} to ${data.status} by user ${updatedBy}`,
      );

      return updatedOrder;
    } catch (error) {
      this.logger.error(`Error updating order status: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update order status', 500, 'STATUS_UPDATE_FAILED');
    }
  }

  /**
   * Update shipping info
   */
  async updateShippingInfo(
    id: string,
    sellerId: string,
    data: UpdateShippingInfoDto,
  ): Promise<OrderWithDetails> {
    try {
      // Check if order exists and user is a seller in this order
      const order = await this.orderRepository.findByIdWithDetails(id);
      if (!order) {
        throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
      }

      // Check if seller is involved in the order
      const isSeller = order.items.some((item) => item.sellerId === sellerId);
      if (!isSeller) {
        throw new AppError(
          'You do not have permission to update shipping for this order',
          403,
          'FORBIDDEN',
        );
      }

      // Validate order state
      if (order.status !== OrderStatus.PROCESSING && order.status !== OrderStatus.SHIPPED) {
        throw new AppError(
          'Shipping information can only be updated for processing or shipped orders',
          400,
          'INVALID_ORDER_STATE',
        );
      }

      // Update shipping info
      const updatedOrder = await this.orderRepository.updateShippingInfo(id, data);

      // Log shipping info update
      this.logger.info(
        `Shipping info updated for order ${id} (${order.orderNumber}) by seller ${sellerId}`,
      );
      if (data.trackingNumber) {
        this.logger.info(`Tracking number ${data.trackingNumber} added to order ${id}`);
      }

      return updatedOrder;
    } catch (error) {
      this.logger.error(`Error updating shipping info: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update shipping information', 500, 'SHIPPING_UPDATE_FAILED');
    }
  }

  /**
   * Process payment for order
   */
  async processPayment(id: string, paymentIntentId: string): Promise<OrderWithDetails> {
    try {
      // In a real implementation, this would integrate with a payment gateway
      // Here we're just simulating a successful payment process
      const updatedOrder = await this.orderRepository.processPayment(id, paymentIntentId);

      // Log payment processing
      this.logger.info(
        `Payment processed for order ${id} (${updatedOrder.orderNumber}), paymentIntentId: ${paymentIntentId}`,
      );

      return updatedOrder;
    } catch (error) {
      this.logger.error(`Error processing payment: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to process payment', 500, 'PAYMENT_PROCESSING_FAILED');
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(id: string, userId: string, note?: string): Promise<OrderWithDetails> {
    try {
      // Get order to check permissions
      const order = await this.orderRepository.findByIdWithDetails(id);
      if (!order) {
        throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
      }

      // Check if user is involved in the order
      const isInvolved = await this.orderRepository.isUserInvolved(id, userId);
      if (!isInvolved) {
        throw new AppError('You do not have permission to cancel this order', 403, 'FORBIDDEN');
      }

      // Validate if order can be cancelled based on its current status
      if (
        order.status === OrderStatus.DELIVERED ||
        order.status === OrderStatus.CANCELLED ||
        order.status === OrderStatus.REFUNDED
      ) {
        throw new AppError(
          `Orders in ${order.status} status cannot be cancelled`,
          400,
          'INVALID_ORDER_STATE',
        );
      }

      // Cancel the order
      const cancelledOrder = await this.orderRepository.cancelOrder(id, note, userId);

      // Log order cancellation
      this.logger.info(`Order ${id} (${order.orderNumber}) cancelled by user ${userId}`);

      // Restore product stock for each item
      for (const item of order.items) {
        await this.productRepository.incrementStock(item.productId, item.quantity);
        this.logger.info(
          `Restored ${item.quantity} units to product ${item.productId} stock after order cancellation`,
        );
      }

      return cancelledOrder;
    } catch (error) {
      this.logger.error(`Error cancelling order: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cancel order', 500, 'CANCELLATION_FAILED');
    }
  }

  /**
   * Get order status history
   */
  async getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    try {
      return await this.orderRepository.getOrderStatusHistory(orderId);
    } catch (error) {
      this.logger.error(`Error getting order status history: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get order status history', 500, 'QUERY_FAILED');
    }
  }

  /**
   * Validate status update based on user role and current status
   */
  private async validateStatusUpdate(
    order: OrderWithDetails,
    newStatus: OrderStatus,
    userId: string,
  ): Promise<void> {
    // Get user to check role
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check specific conditions based on role
    switch (user.role) {
      case 'ADMIN':
        // Admins can make any status change
        return;

      case 'ARTISAN':
        // Artisans can only update orders where they are sellers
        const isSeller = order.items.some((item) => item.sellerId === userId);
        if (!isSeller) {
          throw new AppError('You can only update orders for your products', 403, 'FORBIDDEN');
        }

        // Artisans can mark orders as PROCESSING, SHIPPED or DELIVERED
        if (
          newStatus !== OrderStatus.PROCESSING &&
          newStatus !== OrderStatus.SHIPPED &&
          newStatus !== OrderStatus.DELIVERED
        ) {
          throw new AppError(
            'Artisans can only update orders to processing, shipped, or delivered status',
            403,
            'FORBIDDEN_STATUS_CHANGE',
          );
        }

        // Check valid transitions for artisans
        if (
          (newStatus === OrderStatus.PROCESSING && order.status !== OrderStatus.PAID) ||
          (newStatus === OrderStatus.SHIPPED && order.status !== OrderStatus.PROCESSING) ||
          (newStatus === OrderStatus.DELIVERED && order.status !== OrderStatus.SHIPPED)
        ) {
          throw new AppError(
            `Invalid status transition from ${order.status} to ${newStatus}`,
            400,
            'INVALID_STATUS_TRANSITION',
          );
        }

        break;

      case 'CUSTOMER':
        // Customers can only cancel their own orders
        if (order.userId !== userId) {
          throw new AppError('You can only update your own orders', 403, 'FORBIDDEN');
        }

        // Customers can only cancel orders
        if (newStatus !== OrderStatus.CANCELLED) {
          throw new AppError('Customers can only cancel orders', 403, 'FORBIDDEN_STATUS_CHANGE');
        }

        // Check if order can be cancelled based on current status
        if (
          order.status === OrderStatus.DELIVERED ||
          order.status === OrderStatus.CANCELLED ||
          order.status === OrderStatus.REFUNDED
        ) {
          throw new AppError(
            `Orders in ${order.status} status cannot be cancelled`,
            400,
            'INVALID_ORDER_STATE',
          );
        }

        break;

      default:
        throw new AppError('Unauthorized role', 403, 'FORBIDDEN');
    }
  }
}
