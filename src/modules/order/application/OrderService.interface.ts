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
} from '../domain/entities/Order';
import { OrderStatusHistory } from '../domain/entities/OrderStatusHistory';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IOrderService {
  /**
   * Create order from cart
   */
  createOrderFromCart(userId: string, data: CreateOrderFromCartDto): Promise<OrderWithDetails>;

  /**
   * Create order from quote request
   */
  createOrderFromQuote(userId: string, data: CreateOrderFromQuoteDto): Promise<OrderWithDetails>;

  /**
   * Convert accepted quote to order
   */
  convertQuoteToOrder(
    userId: string,
    quoteId: string,
    data: ConvertToOrderDto,
  ): Promise<OrderWithDetails>;

  /**
   * Get order by ID
   */
  getOrderById(id: string): Promise<OrderWithDetails | null>;

  /**
   * Get order by order number
   */
  getOrderByOrderNumber(orderNumber: string): Promise<OrderWithDetails | null>;

  /**
   * Get customer orders
   */
  getCustomerOrders(
    userId: string,
    options?: Partial<OrderQueryOptions>,
  ): Promise<PaginatedResult<OrderSummary>>;

  /**
   * Get artisan orders
   */
  getArtisanOrders(
    artisanId: string,
    options?: Partial<OrderQueryOptions>,
  ): Promise<PaginatedResult<OrderSummary>>;

  /**
   * Update order status
   */
  updateOrderStatus(
    id: string,
    data: UpdateOrderStatusDto,
    updatedBy: string,
  ): Promise<OrderWithDetails>;

  /**
   * Update shipping info
   */
  updateShippingInfo(
    id: string,
    sellerId: string,
    data: UpdateShippingInfoDto,
  ): Promise<OrderWithDetails>;

  /**
   * Process payment for order
   */
  processPayment(id: string, paymentIntentId: string): Promise<OrderWithDetails>;

  /**
   * Cancel order
   */
  cancelOrder(id: string, userId: string, note?: string): Promise<OrderWithDetails>;

  /**
   * Get order status history
   */
  getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]>;
}
