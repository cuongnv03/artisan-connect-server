import { BaseRepository } from '../../repositories/BaseRepository';
import {
  Order,
  OrderWithDetails,
  OrderSummary,
  OrderQueryOptions,
  CreateOrderFromCartDto,
  CreateOrderFromQuoteDto,
  UpdateOrderStatusDto,
  UpdateShippingInfoDto,
} from '../entities/Order';
import { OrderStatus } from '../valueObjects/OrderEnums';
import { OrderStatusHistory } from '../entities/OrderStatusHistory';
import { PaginatedResult } from '../../common/PaginatedResult';

export interface IOrderRepository extends BaseRepository<Order, string> {
  /**
   * Find order by ID with details
   */
  findByIdWithDetails(id: string): Promise<OrderWithDetails | null>;

  /**
   * Find order by order number
   */
  findByOrderNumber(orderNumber: string): Promise<OrderWithDetails | null>;

  /**
   * Create order from cart
   */
  createOrderFromCart(userId: string, data: CreateOrderFromCartDto): Promise<OrderWithDetails>;

  /**
   * Create order from quote request
   */
  createOrderFromQuote(userId: string, data: CreateOrderFromQuoteDto): Promise<OrderWithDetails>;

  /**
   * Update order status
   */
  updateOrderStatus(
    id: string,
    data: UpdateOrderStatusDto,
    updatedBy?: string,
  ): Promise<OrderWithDetails>;

  /**
   * Update shipping information
   */
  updateShippingInfo(id: string, data: UpdateShippingInfoDto): Promise<OrderWithDetails>;

  /**
   * Get orders with filtering and pagination
   */
  getOrders(options: OrderQueryOptions): Promise<PaginatedResult<OrderSummary>>;

  /**
   * Get artisan orders (orders containing items sold by the artisan)
   */
  getArtisanOrders(
    artisanId: string,
    options: OrderQueryOptions,
  ): Promise<PaginatedResult<OrderSummary>>;

  /**
   * Cancel order
   */
  cancelOrder(id: string, note?: string, cancelledBy?: string): Promise<OrderWithDetails>;

  /**
   * Process payment
   */
  processPayment(id: string, paymentIntentId: string): Promise<OrderWithDetails>;

  /**
   * Get order status history
   */
  getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]>;

  /**
   * Generate unique order number
   */
  generateOrderNumber(): Promise<string>;

  /**
   * Check if user is involved in order
   */
  isUserInvolved(orderId: string, userId: string): Promise<boolean>;
}
