import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
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
import { OrderStatus, PaymentStatus } from '../models/OrderEnums';
import { PaginatedResult } from '../../../shared/interfaces/PaginatedResult';

export interface IOrderRepository extends BaseRepository<Order, string> {
  // Order creation
  createOrderFromCart(userId: string, data: CreateOrderFromCartDto): Promise<OrderWithDetails>;
  createOrderFromQuote(userId: string, data: CreateOrderFromQuoteDto): Promise<OrderWithDetails>;

  // Order retrieval
  findByIdWithDetails(id: string): Promise<OrderWithDetails | null>;
  findByOrderNumber(orderNumber: string): Promise<OrderWithDetails | null>;
  getOrders(options: OrderQueryOptions): Promise<PaginatedResult<OrderSummary>>;
  getCustomerOrders(
    userId: string,
    options?: Partial<OrderQueryOptions>,
  ): Promise<PaginatedResult<OrderSummary>>;
  getSellerOrders(
    sellerId: string,
    options?: Partial<OrderQueryOptions>,
  ): Promise<PaginatedResult<OrderSummary>>;

  // Order management
  updateOrderStatus(
    id: string,
    data: UpdateOrderStatusDto,
    updatedBy?: string,
  ): Promise<OrderWithDetails>;
  cancelOrder(id: string, reason?: string, cancelledBy?: string): Promise<OrderWithDetails>;

  // Payment
  processPayment(id: string, data: ProcessPaymentDto): Promise<OrderWithDetails>;
  refundPayment(id: string, reason?: string): Promise<OrderWithDetails>;

  // Status tracking
  getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]>;
  addStatusHistory(
    orderId: string,
    status: OrderStatus,
    note?: string,
    createdBy?: string,
  ): Promise<OrderStatusHistory>;

  // Utilities
  generateOrderNumber(): Promise<string>;
  getOrderStats(userId?: string, sellerId?: string): Promise<OrderStats>;
  isUserInvolvedInOrder(orderId: string, userId: string): Promise<boolean>;
}
