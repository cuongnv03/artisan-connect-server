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
import { OrderStatus } from '../models/OrderEnums';
import { OrderStatusHistory } from '../models/OrderStatusHistory';
import { CartItem } from '../../cart/models/CartItem';
import { IOrderRepository } from '../repositories/OrderRepository.interface';
import { IUserRepository } from '../../user/repositories/UserRepository.interface';
import { IQuoteRepository } from '../../quote/repositories/QuoteRepository.interface';
import { IProductRepository } from '../../product/repositories/ProductRepository.interface';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';
import container from '../../../core/di/container';

export class OrderService implements IOrderService {
  private orderRepository: IOrderRepository;
  private userRepository: IUserRepository;
  private quoteRepository: IQuoteRepository;
  private productRepository: IProductRepository;
  private cartService: ICartService;
  private quoteService: IQuoteService;
  private logger = Logger.getInstance();

  constructor() {
    this.orderRepository = container.resolve<IOrderRepository>('orderRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
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

      // 4. Lấy thông tin chi tiết giỏ hàng từ CartService
      const cartItems = await this.cartService.getCartItems(userId);

      // 5. Chuẩn bị order items từ cart items
      const { orderItems, subtotal } = await this.prepareOrderItemsFromCart(cartItems);

      // 6. Tạo order number
      const orderNumber = await this.generateOrderNumber();

      // 7. Gọi repository để tạo đơn hàng (không có business logic)
      const order = await this.orderRepository.createOrderWithItems(userId, {
        orderNumber,
        addressId: data.addressId,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        orderItems,
        subtotal,
      });

      // 8. Cập nhật tồn kho cho từng sản phẩm
      for (const item of order.items) {
        await this.productRepository.decrementStock(item.productId, item.quantity);
      }

      // 9. Sau khi tạo đơn hàng thành công, xóa giỏ hàng
      await this.cartService.clearCart(userId);

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
    // Business logic để chuyển đổi cart items sang order items
    const orderItems: any[] = [];
    let subtotal = 0;

    for (const item of cartItems) {
      const product = item.product;
      if (!product) continue;

      // Tính giá cho từng item
      const price = product.discountPrice ?? product.price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      // Chuẩn bị dữ liệu sản phẩm để lưu snapshot
      const productSnapshot = {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        isCustomizable: product.isCustomizable,
      };

      // Thêm vào danh sách order items
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
    // Logic kiểm tra địa chỉ giao hàng
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

      // Tạo đơn hàng từ quote
      const order = await this.orderRepository.createOrderFromQuote(userId, data);

      // Cập nhật trạng thái quote sau khi tạo đơn hàng thành công
      await this.quoteService.updateQuoteStatus(data.quoteRequestId, 'COMPLETED');

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
      await this.quoteService.updateQuoteStatus(quoteId, 'COMPLETED');

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

      return await this.orderRepository.updateOrderStatus(id, data, updatedBy);
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

      return await this.orderRepository.updateShippingInfo(id, data);
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

      return await this.orderRepository.processPayment(id, paymentIntentId);
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

      // Cập nhật trạng thái đơn hàng sang CANCELLED
      const cancelledOrder = await this.orderRepository.updateOrderStatus(
        id,
        OrderStatus.CANCELLED,
        { note: note || 'Order cancelled', createdBy: userId },
      );

      // Khôi phục tồn kho
      for (const item of order.items) {
        await this.productRepository.incrementStock(item.productId, item.quantity);
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
